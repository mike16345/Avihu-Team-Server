import { ClassificationResult, NOT_FITNESS_MESSAGES } from "./dietQuestionClassifier";
import { logTrace } from "./trace";
import { Citation, RagReason, RagResponse, RagStreamTrailer } from "./types";
import { toSseChunk } from "./answer.service";
import { LanguageDetection } from "./language";
import { IRagCacheEntry } from "../models/ragCacheModel";
import { PineconeMatch } from "./pinecone";
import { RAG_CONSTANTS } from "./config";
import { storeCacheHit } from "./pineconeCache";
import { UsageMetrics } from "./openai";

type BranchResult = {
  response: RagResponse;
  stream: boolean;
  events: string[];
  trailer: RagStreamTrailer;
  matches: PineconeMatch[];
  languageDetection: LanguageDetection;
};

export class RagAnswerResponder {
  constructor(
    private readonly userId: string,
    private readonly question: string,
    private readonly languageDetection: LanguageDetection,
    private readonly sessionId?: string,
    private readonly start: number = Date.now(),
    private readonly stream: boolean = false,
    // dependency injection points (kept simple; defaults match current behavior)
    private readonly traceFn: typeof logTrace = logTrace,
    private readonly logger: (obj: any) => void = (o) => console.log(JSON.stringify(o))
  ) {}

  async greeting(): Promise<BranchResult> {
    const response: RagResponse = {
      reason: "GREETING",
      answer: "",
      citations: [],
      cached: false,
      greeting: true,
    };

    const trailer: RagStreamTrailer = { done: true, citations: [] };
    const events = this.stream ? [toSseChunk(trailer)] : [];

    await this.traceFn(
      this.userId,
      this.question,
      this.languageDetection.targetLanguage,
      "GREETING",
      "",
      [],
      undefined,
      this.sessionId
    );

    return {
      response,
      stream: this.stream,
      events,
      trailer,
      matches: [],
      languageDetection: this.languageDetection,
    };
  }

  /** NOT_FITNESS branch */
  async notFitness(classification: ClassificationResult): Promise<BranchResult> {
    const message =
      classification.message || NOT_FITNESS_MESSAGES[this.languageDetection.targetLanguage];

    const response: RagResponse = {
      reason: "NOT_FITNESS",
      answer: message,
      citations: [],
      cached: false,
      refusal: true,
    };

    const trailer: RagStreamTrailer = { done: true, citations: [] };
    const events = this.stream ? [toSseChunk({ delta: message }), toSseChunk(trailer)] : [];

    await this.traceFn(
      this.userId,
      this.question,
      this.languageDetection.targetLanguage,
      "NOT_FITNESS",
      message,
      [],
      undefined,
      this.sessionId
    );

    this.logger({
      evt: "rag.query",
      reason: "NOT_FITNESS",
      userId: this.userId,
      sessionId: this.sessionId,
      language: this.languageDetection.targetLanguage,
      cached: false,
      latencyMs: Date.now() - this.start,
      topScores: [],
      retrievedIds: [],
      usage: undefined,
    });

    return {
      response,
      stream: this.stream,
      events,
      trailer,
      matches: [],
      languageDetection: this.languageDetection,
    };
  }

  /** CACHE_HIT branch */
  async cacheHit(cacheHit: IRagCacheEntry): Promise<BranchResult> {
    const reason = cacheHit.refusal ? "CACHE_REFUSAL" : "CACHE_HIT";
    const response: RagResponse = {
      reason,
      answer: cacheHit.answer,
      citations: cacheHit.citations,
      usage: undefined,
      cached: true,
      notice: cacheHit.notice,
      refusal: cacheHit.refusal,
    };

    const trailer: RagStreamTrailer = { done: true, citations: cacheHit.citations };
    const events: string[] = [];

    if (this.stream) {
      events.push(toSseChunk({ delta: cacheHit.answer }));
      events.push(toSseChunk(trailer));
    }

    await this.traceFn(
      this.userId,
      this.question,
      this.languageDetection.targetLanguage,
      reason,
      cacheHit.answer,
      cacheHit.retrievedIds,
      undefined,
      this.sessionId
    );

    this.logger({
      evt: "rag.query",
      reason,
      userId: this.userId,
      sessionId: this.sessionId,
      language: this.languageDetection.targetLanguage,
      cached: true,
      latencyMs: Date.now() - this.start,
      topScores: typeof cacheHit.topScore === "number" ? [cacheHit.topScore] : [],
      retrievedIds: cacheHit.retrievedIds || [],
      usage: undefined,
    });

    return {
      response,
      stream: this.stream,
      events,
      trailer,
      matches: [],
      languageDetection: this.languageDetection,
    };
  }

  /** RETRIEVAL_EMPTY branch */
  async retrievalEmpty(matches: PineconeMatch[]): Promise<BranchResult> {
    const unknownAnswer =
      this.languageDetection.targetLanguage === "he"
        ? "אני לא יודע מההקשר שסופק."
        : "I don't know from the provided context.";

    const response: RagResponse = {
      reason: "RETRIEVAL_EMPTY",
      answer: unknownAnswer,
      citations: [],
      cached: false,
    };

    const trailer: RagStreamTrailer = { done: true, citations: [] };
    const events = this.stream ? [toSseChunk({ delta: unknownAnswer }), toSseChunk(trailer)] : [];

    await this.traceFn(
      this.userId,
      this.question,
      this.languageDetection.targetLanguage,
      "RETRIEVAL_EMPTY",
      unknownAnswer,
      [],
      undefined,
      this.sessionId
    );

    this.logger({
      evt: "rag.query",
      reason: "RETRIEVAL_EMPTY",
      userId: this.userId,
      sessionId: this.sessionId,
      language: this.languageDetection.targetLanguage,
      cached: false,
      latencyMs: Date.now() - this.start,
      topScores: matches.map((m) => m.score),
      retrievedIds: [],
      usage: undefined,
    });

    return {
      response,
      stream: this.stream,
      events,
      trailer,
      matches: [],
      languageDetection: this.languageDetection,
    };
  }

  async refusal(args: {
    reason: RagReason;
    message: string;
    cached: boolean;
    notice?: string;
  }): Promise<BranchResult> {
    const { reason, message, cached, notice } = args;

    const response: RagResponse = {
      reason,
      answer: message,
      citations: [],
      cached,
      notice,
      refusal: true,
    };

    const trailer: RagStreamTrailer = { done: true, citations: [] };
    const events = this.stream ? [toSseChunk({ delta: message }), toSseChunk(trailer)] : [];

    await this.traceFn(
      this.userId,
      this.question,
      this.languageDetection.targetLanguage,
      reason,
      message,
      [],
      undefined,
      this.sessionId
    );

    this.logger({
      evt: "rag.query",
      reason,
      userId: this.userId,
      sessionId: this.sessionId,
      language: this.languageDetection.targetLanguage,
      cached,
      latencyMs: Date.now() - this.start,
      topScores: [],
      retrievedIds: [],
      usage: undefined,
    });

    return {
      response,
      stream: this.stream,
      events,
      trailer,
      matches: [],
      languageDetection: this.languageDetection,
    };
  }

  async answerGenerated(args: {
    finalAnswer: string;
    citations: Citation[];
    usage?: UsageMetrics;
    filteredMatches: PineconeMatch[];
    embedding: number[];
    normalizedQuestion: string;
    deltas: string[];
    effectiveTopK: number;
    effectiveThreshold: number;
  }): Promise<BranchResult> {
    const {
      finalAnswer,
      citations,
      usage,
      effectiveThreshold,
      effectiveTopK,
      embedding,
      filteredMatches,
      deltas,
      normalizedQuestion,
    } = args;

    const response: RagResponse = {
      reason: "ANSWER_GENERATED",
      answer: finalAnswer,
      citations,
      usage,
      cached: false,
      notice: this.languageDetection.needsFallbackNotice
        ? RAG_CONSTANTS.languageFallbackNotice
        : undefined,
    };

    const trailer: RagStreamTrailer = {
      done: true,
      citations,
      usage,
    };

    const events = this.stream ? [...deltas, toSseChunk(trailer)] : [];
    const retrievedIds = citations.map((citation) => citation.sourceId);
    const cacheDoc: IRagCacheEntry = {
      userId: this.userId,
      question: this.question,
      normalizedQuestion: normalizedQuestion,
      answer: finalAnswer,
      language: this.languageDetection.targetLanguage,
      citations,
      retrievedIds,
      topScore: filteredMatches[0]?.score || 0,
      embedding,
      refusal: false,
      notice: this.languageDetection.needsFallbackNotice
        ? RAG_CONSTANTS.languageFallbackNotice
        : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const lowerAnswer = finalAnswer.toLowerCase();

    if (
      finalAnswer &&
      !finalAnswer.includes("אני לא יודע") &&
      !lowerAnswer.includes("i don't know")
    ) {
      try {
        await storeCacheHit(cacheDoc, embedding, this.userId);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : undefined;
        this.logger({
          evt: "rag.cache_write.error",
          reason: "ANSWER_GENERATED",
          userId: this.userId,
          sessionId: this.sessionId,
          message,
          stack,
        });
      }
    }

    await this.traceFn(
      this.userId,
      this.question,
      this.languageDetection.targetLanguage,
      "ANSWER_GENERATED",
      finalAnswer,
      retrievedIds,
      usage,
      this.sessionId
    );

    this.logger({
      evt: "rag.query",
      reason: "ANSWER_GENERATED",
      userId: this.userId,
      sessionId: this.sessionId,
      language: this.languageDetection.targetLanguage,
      cached: false,
      latencyMs: Date.now() - this.start,
      topK: effectiveTopK,
      threshold: effectiveThreshold,
      retrievedIds,
      topScores: filteredMatches.map((match) => match.score),
      usage,
    });

    return {
      response,
      stream: this.stream,
      events,
      trailer,
      matches: filteredMatches,
      languageDetection: this.languageDetection,
    };
  }
}
