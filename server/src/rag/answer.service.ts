import { StatusCode } from "../enums/StatusCode";
import { detectLanguage } from "./language";
import { classifyQuestion } from "./dietQuestionClassifier";
import { generateAnswer } from "./openai";
import { buildMetadataFilter, queryPinecone, trimMatches, upsertVectors } from "./pinecone";
import { RAG_CONSTANTS } from "./config";
import { getRagSourceRepository } from "./db";
import { RagIngestRequest, RagRequest, RagResponse, RagStreamTrailer } from "./types";
import { UsageMetrics } from "./openai";
import { ensureRateLimit } from "./rate-limit";
import { toCitations, toContextBlocks } from "./context";
import { findCacheHit, storeCacheHit } from "./pineconeCache";
import { prepareChunks } from "./ingest";
import { normalizeAndEmbed } from "./embedding";
import { RagAnswerResponder } from "./responses";

const sourceRepository = getRagSourceRepository();

export const toSseChunk = (payload: Record<string, any>) => `data: ${JSON.stringify(payload)}\n\n`;

export class RagAnswerService {
  async answerQuestion(request: RagRequest) {
    const start = Date.now();
    const {
      userId,
      question,
      sessionId,
      stream = false,
      topK,
      threshold,
      cacheThreshold,
      metadata = {},
    } = request;

    if (!userId || !question) {
      throw { status: StatusCode.BAD_REQUEST, message: "userId and question are required" };
    }

    await ensureRateLimit(userId);

    const languageDetection = detectLanguage(question);
    const { normalizedQuestion, embedding } = await normalizeAndEmbed(question);

    const Responder = new RagAnswerResponder(userId, question, languageDetection, sessionId, start);

    const effectiveCacheThreshold =
      typeof cacheThreshold === "number" ? cacheThreshold : RAG_CONSTANTS.defaultCacheThreshold;

    const cacheHit = await findCacheHit(
      userId,
      embedding,
      effectiveCacheThreshold,
      languageDetection.targetLanguage
    );

    if (cacheHit) {
      return await Responder.cacheHit(cacheHit);
    }

    const classification = classifyQuestion(normalizedQuestion, languageDetection.targetLanguage);

    if (!classification.isFitness) {
      return await Responder.notFitness(classification);
    }

    const effectiveTopK = typeof topK === "number" ? topK : RAG_CONSTANTS.defaultTopK;
    const effectiveThreshold =
      typeof threshold === "number" ? threshold : RAG_CONSTANTS.defaultThreshold;

    const filter = buildMetadataFilter(userId, languageDetection.targetLanguage, metadata);

    let matches = trimMatches(
      await queryPinecone({
        namespace: RAG_CONSTANTS.corpusNamespace,
        topK: effectiveTopK,
        vector: embedding,
        filter,
      })
    );

    const hasAboveThreshold = matches.some((match) => (match.score || 0) >= effectiveThreshold);

    if (!hasAboveThreshold) {
      matches = trimMatches(
        await queryPinecone({
          namespace: RAG_CONSTANTS.corpusNamespace,
          topK: effectiveTopK,
          vector: embedding,
          filter: buildMetadataFilter(userId, "", metadata),
        })
      );
    }

    const filteredMatches = matches.filter((match) => (match.score || 0) >= effectiveThreshold);

    if (!filteredMatches.length) {
      return await Responder.retrievalEmpty(matches);
    }

    const citations = toCitations(filteredMatches);
    const contextBlocks = toContextBlocks(filteredMatches);

    const deltas: string[] = [];
    let finalAnswer = "";
    let usage: UsageMetrics | undefined;

    if (stream) {
      if (languageDetection.needsFallbackNotice) {
        deltas.push(toSseChunk({ delta: `${RAG_CONSTANTS.languageFallbackNotice}\n\n` }));
      }

      const result = await generateAnswer({
        targetLanguage: languageDetection.targetLanguage,
        contextBlocks,
        question,
        summary: undefined,
        stream: true,
        callbacks: {
          onDelta: (delta) => {
            if (!delta) return;
            deltas.push(toSseChunk({ delta }));
          },
        },
      });

      finalAnswer = result.answer;
      usage = result.usage;

      if (languageDetection.needsFallbackNotice) {
        finalAnswer = `${RAG_CONSTANTS.languageFallbackNotice}\n\n${finalAnswer}`;
      }
    } else {
      const result = await generateAnswer({
        targetLanguage: languageDetection.targetLanguage,
        contextBlocks,
        question,
        summary: undefined,
        stream: false,
      });

      finalAnswer = result.answer;
      usage = result.usage;

      if (languageDetection.needsFallbackNotice) {
        finalAnswer = `${RAG_CONSTANTS.languageFallbackNotice}\n\n${finalAnswer}`;
      }
    }

    if (!finalAnswer) {
      finalAnswer =
        languageDetection.targetLanguage === "he"
          ? "לא הצלחתי להפיק תשובה מההקשר שסופק."
          : "I was unable to generate an answer from the provided context.";
    }

    return Responder.answerGenerated({
      citations,
      deltas,
      effectiveThreshold,
      effectiveTopK,
      embedding,
      filteredMatches,
      finalAnswer,
      normalizedQuestion,
      usage,
    });
  }

  async ingest(request: RagIngestRequest) {
    const { userId, sourceId, chunks, visibility = "private", lang = "en" } = request;

    if (!userId || !sourceId) {
      throw { status: StatusCode.BAD_REQUEST, message: "userId and sourceId are required" };
    }

    if (!Array.isArray(chunks) || chunks.length === 0) {
      throw { status: StatusCode.BAD_REQUEST, message: "chunks are required" };
    }

    const prepared = await prepareChunks(chunks, userId);
    const filtered = prepared.filter((item): item is NonNullable<typeof item> => Boolean(item));

    if (!filtered.length) {
      return { inserted: 0 };
    }

    await Promise.all(
      filtered.map((item) =>
        sourceRepository.upsertChunk({
          userId,
          sourceId,
          chunkId: item.chunkId,
          text: item.text,
          hash: item.hash,
          metadata: item.metadata,
          lang,
          visibility,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any)
      )
    );

    await upsertVectors(
      RAG_CONSTANTS.corpusNamespace,
      filtered.map((item) => ({
        id: `${userId}-${sourceId}-${item.chunkId}`,
        values: item.embedding,
        metadata: {
          userId,
          sourceId,
          lang,
          visibility,
          text: item.text,
          page: item.metadata?.page,
          tags: item.metadata?.tags,
          hash: item.hash,
        },
      }))
    );

    return { inserted: filtered.length };
  }
}
