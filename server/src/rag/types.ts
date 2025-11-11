import { IRagCitation } from "../models/ragCacheModel";
import { UsageMetrics } from "./openai";
import { SupportedLanguage } from "./language";

export type RagReason =
  | "CACHE_HIT"
  | "CACHE_REFUSAL"
  | "CACHE_MISS"
  | "CACHE_STORED"
  | "GREETING"
  | "BLOCKED"
  | "NOT_FITNESS"
  | "RETRIEVAL_EMPTY"
  | "ANSWER_GENERATED";

export type RagRequest = {
  userId: string;
  question: string;
  sessionId?: string;
  stream?: boolean;
  topK?: number;
  threshold?: number;
  cacheThreshold?: number;
  metadata?: Record<string, any>;
};

export type RagIngestChunk = {
  id: string;
  text: string;
  metadata?: Record<string, any>;
};

export type RagIngestRequest = {
  userId: string;
  sourceId: string;
  visibility?: "private" | "shared";
  lang?: SupportedLanguage;
  chunks: RagIngestChunk[];
};

export type Citation = IRagCitation;

export type RagResponse = {
  reason: RagReason;
  answer: string;
  citations: Citation[];
  usage?: UsageMetrics;
  cached?: boolean;
  notice?: string;
  refusal?: boolean;
  greeting?: boolean;
};

export type RagStreamTrailer = {
  done: boolean;
  citations: Citation[];
  usage?: UsageMetrics;
};
