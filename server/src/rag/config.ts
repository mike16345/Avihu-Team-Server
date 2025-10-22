const parsePositiveNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
};

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (typeof value === "undefined") {
    return fallback;
  }

  if (value === "1" || value?.toLowerCase() === "true") {
    return true;
  }

  if (value === "0" || value?.toLowerCase() === "false") {
    return false;
  }

  return fallback;
};

const DEFAULT_EMBED_MODEL = "text-embedding-3-small";
const DEFAULT_EMBED_DIMENSION = 512;

export const RAG_CONSTANTS = {
  cacheNamespace: "semantic-cache",
  corpusNamespace: "corpus",
  defaultTopK: parsePositiveNumber(process.env.RAG_RETRIEVAL_TOP_K, 5),
  defaultThreshold: Number.isFinite(Number(process.env.RAG_RETRIEVAL_THRESHOLD))
    ? Number(process.env.RAG_RETRIEVAL_THRESHOLD)
    : 0.5,
  defaultCacheThreshold: Number.isFinite(Number(process.env.RAG_CACHE_THRESHOLD))
    ? Number(process.env.RAG_CACHE_THRESHOLD)
    : 0.88,
  maxContextChunks: 6,
  minContextSentences: 2,
  languageFallbackNotice: "השאלה זוהתה בשפה שאינה נתמכת, התשובה מסופקת בעברית בהתאם למדיניות.",
  rateLimitWindowMs: parsePositiveNumber(process.env.RAG_RATE_LIMIT_WINDOW_MS, 60_000),
  rateLimitMaxRequests: parsePositiveNumber(process.env.RAG_RATE_LIMIT_MAX_REQUESTS, 8),
  chatModel: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
  embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || DEFAULT_EMBED_MODEL,
  embeddingDimensions: parsePositiveNumber(
    process.env.OPENAI_EMBEDDING_DIMENSIONS,
    DEFAULT_EMBED_DIMENSION
  ),
  allowFallbackLLMWithoutContext: parseBoolean(process.env.RAG_ALLOW_FALLBACK_LLM, true),
  denylistEnabled: parseBoolean(process.env.RAG_DENYLIST_ENABLED, true),
  binaryClassifierEnabled: parseBoolean(process.env.RAG_BINARY_CLASSIFIER_ENABLED, true),
  cacheRefusalStubs: parseBoolean(process.env.RAG_CACHE_REFUSAL_STUBS, true),
  binaryClassifierModel: process.env.RAG_BINARY_CLASSIFIER_MODEL || "gpt-3.5-turbo",
  binaryClassifierMaxTokens: parsePositiveNumber(process.env.RAG_BINARY_CLASSIFIER_MAX_TOKENS, 4),
};

export const RAG_LIMITS = {
  perUserDailyLimit: 50, // hard cap per user per UTC day
} as const;

// Cost note: if N users all hit 50 Q/day, that's N*50/day ≈ N*1,500 Q/month.
// With gpt-4o-mini (~$0.000285 per non-cached Q, rough), 100 users ≈ 150k Q/mo ≈ $42.75 (before cache).

export const getPineconeIndexName = () => process.env.PINECONE_INDEX || "diet-questions";

export const EMBEDDING_CONFIG = {
  model: RAG_CONSTANTS.embeddingModel,
  dimensions: RAG_CONSTANTS.embeddingDimensions,
};
