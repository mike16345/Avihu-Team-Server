const parsePositiveNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
};

export const RAG_CONSTANTS = {
  cacheNamespace: "semantic-cache",
  corpusNamespace: "corpus",
  defaultTopK: parsePositiveNumber(process.env.RAG_RETRIEVAL_TOP_K, 5),
  defaultThreshold: Number.isFinite(Number(process.env.RAG_RETRIEVAL_THRESHOLD))
    ? Number(process.env.RAG_RETRIEVAL_THRESHOLD)
    : 0.5,
  defaultCacheThreshold: Number.isFinite(Number(process.env.RAG_CACHE_THRESHOLD))
    ? Number(process.env.RAG_CACHE_THRESHOLD)
    : 0.9,
  maxContextChunks: 6,
  minContextSentences: 2,
  languageFallbackNotice: "השאלה זוהתה בשפה שאינה נתמכת, התשובה מסופקת בעברית בהתאם למדיניות.",
  rateLimitWindowMs: parsePositiveNumber(process.env.RAG_RATE_LIMIT_WINDOW_MS, 60_000),
  rateLimitMaxRequests: parsePositiveNumber(process.env.RAG_RATE_LIMIT_MAX_REQUESTS, 8),
  chatModel: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
  embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
  embeddingDimensions: parsePositiveNumber(process.env.OPENAI_EMBEDDING_DIMENSIONS, 512),
  allowFallbackLLMWithoutContext: true,
};

export const getPineconeIndexName = () => process.env.PINECONE_INDEX || "diet-questions";
