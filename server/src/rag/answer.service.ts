import { createHash } from "crypto";
import { StatusCode } from "../enums/StatusCode";
import { detectLanguage } from "./language";
import { classifyQuestion, NOT_FITNESS_MESSAGES } from "./dietQuestionClassifier";
import { createEmbedding, generateAnswer } from "./openai";
import {
  buildMetadataFilter,
  queryPinecone,
  trimMatches,
  upsertVectors,
  PineconeMatch,
} from "./pinecone";
import { normalizeText, summariseSentences } from "./text";
import { RAG_CONSTANTS } from "./config";
import {
  getRagCacheRepository,
  getRagRateLimitRepository,
  getRagSourceRepository,
  getRagTraceRepository,
} from "./db";
import {
  Citation,
  RagIngestRequest,
  RagReason,
  RagRequest,
  RagResponse,
  RagStreamTrailer,
} from "./types";
import RagRateLimitModel, { IRagRateLimit } from "../models/ragRateLimitModel";
import { IRagCacheEntry } from "../models/ragCacheModel";
import { UsageMetrics } from "./openai";

const cacheRepository = getRagCacheRepository();
const traceRepository = getRagTraceRepository();
const rateLimitRepository = getRagRateLimitRepository();
const sourceRepository = getRagSourceRepository();

const toSseChunk = (payload: Record<string, any>) => `data: ${JSON.stringify(payload)}\n\n`;

const buildCitations = (matches: PineconeMatch[]): Citation[] =>
  matches.map((match, index) => ({
    marker: `[^${index + 1}]`,
    sourceId: String(match.metadata?.sourceId || match.id),
    page: match.metadata?.page,
    score: match.score,
  }));

const buildContextBlocks = (matches: PineconeMatch[]): string[] =>
  matches.map((match, index) => {
    const text = match.metadata?.text || "";
    return `[${index + 1}] ${summariseSentences(text, RAG_CONSTANTS.minContextSentences)}`;
  });

const ensureRateLimit = async (userId: string) => {
  const now = new Date();
  const windowStart = new Date(now.getTime() - RAG_CONSTANTS.rateLimitWindowMs);

  let record: IRagRateLimit | null = null;

  try {
    record = await RagRateLimitModel.findOne({ userId }).lean();
  } catch (error) {
    record = null;
  }

  const filteredEvents = (record?.events || []).filter((event) => event > windowStart);

  if (filteredEvents.length >= RAG_CONSTANTS.rateLimitMaxRequests) {
    throw { status: StatusCode.TOO_MANY_REQUESTS, message: "rate limit exceeded" };
  }

  filteredEvents.push(now);

  if (record) {
    await rateLimitRepository.updateOne(
      { userId } as any,
      {
        events: filteredEvents,
        updatedAt: now,
      } as any
    );
  } else {
    await rateLimitRepository.create({
      userId,
      events: filteredEvents,
      createdAt: now,
      updatedAt: now,
    } as any);
  }
};

const cacheVectorId = (cacheId: string, userId: string) => `cache-${userId}-${cacheId}`;

const findCacheHit = async (
  userId: string,
  embedding: number[],
  cacheThreshold: number,
  language: string
): Promise<IRagCacheEntry | null> => {
  const matches = await queryPinecone({
    namespace: RAG_CONSTANTS.cacheNamespace,
    topK: 3,
    vector: embedding,
    filter: buildMetadataFilter(userId, language),
  });

  if (!matches.length) return null;

  const [best] = matches;
  if (!best || (best.score || 0) < cacheThreshold) {
    return null;
  }

  const cacheId = best.metadata?.cacheId as string | undefined;
  if (cacheId) {
    const cacheDoc = await cacheRepository.findByIdLean(cacheId);
    if (cacheDoc) {
      return cacheDoc;
    }
  }

  const normalizedQuestion = best.metadata?.normalizedQuestion as string | undefined;
  if (normalizedQuestion) {
    return await cacheRepository.findByNormalizedQuestion(userId, normalizedQuestion);
  }

  return null;
};

const storeCacheHit = async (doc: IRagCacheEntry, embedding: number[], userId: string) => {
  const stored = await cacheRepository.upsertCacheEntry(doc);
  if (!stored) return;
  const cacheId = String((stored as any)?._id || doc.normalizedQuestion);
  await upsertVectors(RAG_CONSTANTS.cacheNamespace, [
    {
      id: cacheVectorId(cacheId, userId),
      values: embedding,
      metadata: {
        userId,
        lang: doc.language,
        normalizedQuestion: doc.normalizedQuestion,
        cacheId,
        retrievedIds: doc.retrievedIds,
        topScore: doc.topScore,
      },
    },
  ]);
};

const logTrace = async (
  userId: string,
  question: string,
  language: string,
  reason: RagReason,
  answer: string,
  retrievedIds: string[],
  usage?: UsageMetrics,
  sessionId?: string
) => {
  const preview = answer.length > 280 ? `${answer.slice(0, 277)}...` : answer;
  await traceRepository.create({
    userId,
    sessionId,
    question,
    language,
    reason,
    retrievedIds,
    answerPreview: preview,
    usage,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any);
};

const computeHash = (text: string) =>
  createHash("sha256").update(normalizeText(text)).digest("hex");

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
    const normalizedQuestion = normalizeText(question);
    const embedding = await createEmbedding(normalizedQuestion);

    const effectiveCacheThreshold =
      typeof cacheThreshold === "number" ? cacheThreshold : RAG_CONSTANTS.defaultCacheThreshold;

    const cacheHit = await findCacheHit(
      userId,
      embedding,
      effectiveCacheThreshold,
      languageDetection.targetLanguage
    );

    if (cacheHit) {
      const response: RagResponse = {
        reason: "CACHE_HIT",
        answer: cacheHit.answer,
        citations: cacheHit.citations,
        usage: undefined,
        cached: true,
        notice: cacheHit.notice,
      };

      const trailer: RagStreamTrailer = {
        done: true,
        citations: cacheHit.citations,
      };

      const events: string[] = [];
      if (stream) {
        events.push(toSseChunk({ delta: cacheHit.answer }));
        events.push(toSseChunk(trailer));
      }

      await logTrace(
        userId,
        question,
        languageDetection.targetLanguage,
        "CACHE_HIT",
        cacheHit.answer,
        cacheHit.retrievedIds,
        undefined,
        sessionId
      );

      console.log(
        JSON.stringify({
          evt: "rag.query",
          reason: "CACHE_HIT",
          userId,
          sessionId,
          language: languageDetection.targetLanguage,
          cached: true,
          latencyMs: Date.now() - start,
          topScores: [cacheHit.topScore],
          retrievedIds: cacheHit.retrievedIds,
        })
      );

      return {
        response,
        stream,
        events,
        trailer,
        matches: [],
        languageDetection,
      };
    }

    const classification = classifyQuestion(normalizedQuestion, languageDetection.targetLanguage);

    if (!classification.isFitness) {
      const message =
        classification.message || NOT_FITNESS_MESSAGES[languageDetection.targetLanguage];
      const response: RagResponse = {
        reason: "NOT_FITNESS",
        answer: message,
        citations: [],
        cached: false,
      };
      const trailer: RagStreamTrailer = { done: true, citations: [] };
      const events = stream ? [toSseChunk({ delta: message }), toSseChunk(trailer)] : [];

      await logTrace(
        userId,
        question,
        languageDetection.targetLanguage,
        "NOT_FITNESS",
        message,
        [],
        undefined,
        sessionId
      );

      console.log(
        JSON.stringify({
          evt: "rag.query",
          reason: "NOT_FITNESS",
          userId,
          sessionId,
          language: languageDetection.targetLanguage,
          cached: false,
          latencyMs: Date.now() - start,
          topScores: [],
          retrievedIds: [],
        })
      );

      return { response, stream, events, trailer, matches: [], languageDetection };
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
      const unknownAnswer =
        languageDetection.targetLanguage === "he"
          ? "אני לא יודע מההקשר שסופק."
          : "I don't know from the provided context.";

      const response: RagResponse = {
        reason: "RETRIEVAL_EMPTY",
        answer: unknownAnswer,
        citations: [],
        cached: false,
      };
      const trailer: RagStreamTrailer = { done: true, citations: [] };
      const events = stream ? [toSseChunk({ delta: unknownAnswer }), toSseChunk(trailer)] : [];

      await logTrace(
        userId,
        question,
        languageDetection.targetLanguage,
        "RETRIEVAL_EMPTY",
        unknownAnswer,
        [],
        undefined,
        sessionId
      );

      console.log(
        JSON.stringify({
          evt: "rag.query",
          reason: "RETRIEVAL_EMPTY",
          userId,
          sessionId,
          language: languageDetection.targetLanguage,
          cached: false,
          latencyMs: Date.now() - start,
          topScores: matches.map((match) => match.score),
          retrievedIds: [],
        })
      );

      return { response, stream, events, trailer, matches: [], languageDetection };
    }

    const citations = buildCitations(filteredMatches);
    const contextBlocks = buildContextBlocks(filteredMatches);

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

    const response: RagResponse = {
      reason: "ANSWER_GENERATED",
      answer: finalAnswer,
      citations,
      usage,
      cached: false,
      notice: languageDetection.needsFallbackNotice
        ? RAG_CONSTANTS.languageFallbackNotice
        : undefined,
    };

    const trailer: RagStreamTrailer = {
      done: true,
      citations,
      usage,
    };

    const events = stream ? [...deltas, toSseChunk(trailer)] : [];

    const retrievedIds = citations.map((citation) => citation.sourceId);

    const cacheDoc: IRagCacheEntry = {
      userId,
      question,
      normalizedQuestion,
      answer: finalAnswer,
      language: languageDetection.targetLanguage,
      citations,
      retrievedIds,
      topScore: filteredMatches[0]?.score || 0,
      embedding,
      refusal: false,
      notice: languageDetection.needsFallbackNotice
        ? RAG_CONSTANTS.languageFallbackNotice
        : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const lowerAnswer = finalAnswer.toLowerCase();
    if (
      citations.length > 0 &&
      finalAnswer &&
      !finalAnswer.includes("אני לא יודע") &&
      !lowerAnswer.includes("i don't know")
    ) {
      await storeCacheHit(cacheDoc, embedding, userId);
    }

    await logTrace(
      userId,
      question,
      languageDetection.targetLanguage,
      "ANSWER_GENERATED",
      finalAnswer,
      retrievedIds,
      usage,
      sessionId
    );

    console.log(
      JSON.stringify({
        evt: "rag.query",
        reason: "ANSWER_GENERATED",
        userId,
        sessionId,
        language: languageDetection.targetLanguage,
        cached: false,
        latencyMs: Date.now() - start,
        topK: effectiveTopK,
        threshold: effectiveThreshold,
        retrievedIds,
        topScores: filteredMatches.map((match) => match.score),
        usage,
      })
    );

    return {
      response,
      stream,
      events,
      trailer,
      matches: filteredMatches,
      languageDetection,
    };
  }

  async ingest(request: RagIngestRequest) {
    const { userId, sourceId, chunks, visibility = "private", lang = "en" } = request;
    if (!userId || !sourceId) {
      throw { status: StatusCode.BAD_REQUEST, message: "userId and sourceId are required" };
    }
    if (!Array.isArray(chunks) || chunks.length === 0) {
      throw { status: StatusCode.BAD_REQUEST, message: "chunks are required" };
    }

    const prepared = await Promise.all(
      chunks.map(async (chunk) => {
        const text = normalizeText(chunk.text || "");
        if (!text) return null;
        const hash = computeHash(text);
        const existing = await sourceRepository.findByHash(userId, hash);
        if (existing) {
          return null;
        }
        const embedding = await createEmbedding(text);
        const chunkId = chunk.id || computeHash(`${hash}-${Date.now()}`);
        return {
          text,
          hash,
          embedding,
          chunkId,
          metadata: chunk.metadata || {},
        };
      })
    );

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
