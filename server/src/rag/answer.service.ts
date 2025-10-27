import { StatusCode } from "../enums/StatusCode";
import { detectLanguage } from "./language";
import { classifyQuestion } from "./dietQuestionClassifier";
import { generateAnswer } from "./openai";
import { buildMetadataFilter, queryPinecone, trimMatches, upsertVectors } from "./pinecone";
import { RAG_CONSTANTS, RAG_LIMITS } from "./config";
import {
  getRagCacheRepository,
  getRagDailyQuotaRepository,
  getRagSourceRepository,
  getSystemStatusRepository,
} from "./db";
import { RagIngestRequest, RagRequest } from "./types";
import { UsageMetrics } from "./openai";
import { ensureRateLimit } from "./rate-limit";
import { toCitations, toContextBlocks } from "./context";
import { findCacheHit, storeCacheHit } from "./pineconeCache";
import { prepareChunks } from "./ingest";
import { normalizeAndEmbed } from "./embedding";
import { RagAnswerResponder } from "./responses";
import { matchDenylistedTopic, BLOCKED_TOPIC_MESSAGES } from "./denylist";
import { isGreeting } from "./greetings";
import { runBinaryClassifier, runBinaryClassifierLLM } from "./binaryClassifier";
import { normalizeText } from "./text";
import { IRagCacheEntry } from "../models/ragCacheModel";
import { yyyymmddUTC, nextUTCmidnightISO } from "./utils/date";

const sourceRepository = getRagSourceRepository();
const cacheRepository = getRagCacheRepository();
const dailyQuotaRepository = getRagDailyQuotaRepository();
const systemStatusRepository = getSystemStatusRepository();

export async function ensureNotPausedOrThrow() {
  const { paused, message } = await systemStatusRepository.get();
  if (paused) {
    console.log(
      JSON.stringify({
        evt: "rag.paused",
        reason: message,
      })
    );

    const err: any = {
      status: StatusCode.SERVICE_UNAVAILABLE,
      message: message || "service temporarily paused",
      code: "SERVICE_PAUSED",
    };
    throw err;
  }
}

export async function ensureDailyQuotaOrThrow(userId: string) {
  const date = yyyymmddUTC();
  const doc = await dailyQuotaRepository.incAndGet({ userId, date });
  if (doc && doc.count > RAG_LIMITS.perUserDailyLimit) {
    console.log(
      JSON.stringify({
        evt: "rag.quota",
        userId,
        date,
        count: doc.count,
        limit: RAG_LIMITS.perUserDailyLimit,
      })
    );

    const resetAt = nextUTCmidnightISO();
    const err: any = {
      status: StatusCode.TOO_MANY_REQUESTS,
      message: "daily limit reached",
      code: "DAILY_LIMIT_REACHED",
      limit: RAG_LIMITS.perUserDailyLimit,
      resetAt,
    };
    throw err;
  }
}

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
    await ensureNotPausedOrThrow();
    await ensureDailyQuotaOrThrow(userId);
    await ensureRateLimit(userId);

    const languageDetection = detectLanguage(question);
    const normalizedPlainQuestion = normalizeText(question);

    const Responder = new RagAnswerResponder(
      userId,
      question,
      languageDetection,
      sessionId,
      start,
      stream
    );

    if (isGreeting(normalizedPlainQuestion)) {
      return await Responder.greeting();
    }

    let normalizedQuestion = normalizedPlainQuestion;
    let embedding: number[] = [];

    if (RAG_CONSTANTS.denylistEnabled) {
      const denylistTerm = matchDenylistedTopic(normalizedPlainQuestion);
      if (denylistTerm) {
        const existingRefusal = await cacheRepository.findByNormalizedQuestion(
          userId,
          normalizedPlainQuestion
        );

        console.log(
          JSON.stringify({
            evt: "rag.blocked_topic",
            userId,
            sessionId,
            term: denylistTerm,
            cached: existingRefusal?.refusal === true,
          })
        );

        if (existingRefusal && existingRefusal.refusal) {
          return await Responder.cacheHit(existingRefusal);
        }

        const refusalMessage = BLOCKED_TOPIC_MESSAGES[languageDetection.targetLanguage];

        if (RAG_CONSTANTS.cacheRefusalStubs) {
          const embedResult = await normalizeAndEmbed(question);
          normalizedQuestion = embedResult.normalizedQuestion;
          embedding = embedResult.embedding;

          const refusalDoc: IRagCacheEntry = {
            userId,
            question,
            normalizedQuestion,
            answer: refusalMessage,
            language: languageDetection.targetLanguage,
            citations: [],
            retrievedIds: [],
            topScore: 1,
            embedding,
            refusal: true,
            notice: languageDetection.needsFallbackNotice
              ? RAG_CONSTANTS.languageFallbackNotice
              : undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await storeCacheHit(refusalDoc, embedding, userId);
        }

        return await Responder.refusal({
          reason: "BLOCKED",
          message: refusalMessage,
          cached: false,
          notice: languageDetection.needsFallbackNotice
            ? RAG_CONSTANTS.languageFallbackNotice
            : undefined,
        });
      }
    }

    if (!embedding.length) {
      const embedResult = await normalizeAndEmbed(question);
      normalizedQuestion = embedResult.normalizedQuestion;
      embedding = embedResult.embedding;
    }

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

    let allowFitness = classification.isFitness;

    if (!allowFitness && RAG_CONSTANTS.binaryClassifierEnabled) {
      const heuristicStart = Date.now();
      const binaryResult = runBinaryClassifier(normalizedQuestion);

      console.log(
        JSON.stringify({
          evt: "rag.binary_classifier",
          stage: "HEURISTIC",
          userId,
          sessionId,
          decision: binaryResult.isFitness ? "FITNESS" : "NOT_FITNESS",
          score: binaryResult.score,
          matchedPositive: binaryResult.matchedPositive,
          matchedNegative: binaryResult.matchedNegative,
          latencyMs: Date.now() - heuristicStart,
        })
      );

      allowFitness = binaryResult.isFitness;

      if (!allowFitness) {
        const llmStart = Date.now();
        try {
          const llmResult = await runBinaryClassifierLLM(question);

          console.log(
            JSON.stringify({
              evt: "rag.binary_classifier",
              stage: "LLM",
              userId,
              sessionId,
              decision: llmResult.isFitness ? "FITNESS" : "NOT_FITNESS",
              latencyMs: Date.now() - llmStart,
              usage: llmResult.usage,
              raw: llmResult.raw,
            })
          );

          allowFitness = llmResult.isFitness;
        } catch (error) {
          console.error(
            JSON.stringify({
              evt: "rag.binary_classifier_error",
              stage: "LLM",
              userId,
              sessionId,
              error: String(error),
            })
          );
        }
      }
    }

    if (!allowFitness) {
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

    if (!filteredMatches.length && !RAG_CONSTANTS.allowFallbackLLMWithoutContext) {
      return await Responder.retrievalEmpty(matches);
    }

    const noContextFallback = filteredMatches.length === 0;

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
        noContextFallback,
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
        noContextFallback,
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
