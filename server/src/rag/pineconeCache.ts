import { IRagCacheEntry } from "../models/ragCacheModel";
import { RAG_CONSTANTS } from "./config";
import { getRagCacheRepository } from "./db";
import {
  queryPinecone,
  buildMetadataFilter,
  upsertVectors,
  deleteVectors,
} from "./pinecone";

const cacheRepository = getRagCacheRepository();

const cacheVectorId = (cacheId: string, userId: string) => `cache-${userId}-${cacheId}`;

const log = (obj: Record<string, any>) => console.log(JSON.stringify(obj));

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

  if (!matches.length) {
    log({
      evt: "rag.cache_miss",
      userId,
      reason: "NO_MATCHES",
      cacheThreshold,
      bestScore: null,
      bestNormalizedQuestion: undefined,
    });
    return null;
  }

  const [best] = matches;
  const bestScore = best?.score ?? null;
  const bestNormalizedQuestion =
    typeof best?.metadata?.normalizedQuestion === "string"
      ? (best?.metadata?.normalizedQuestion as string)
      : undefined;

  let missLogged = false;
  const logMiss = (reason: string) => {
    if (missLogged) return;
    missLogged = true;
    log({
      evt: "rag.cache_miss",
      userId,
      reason,
      cacheThreshold,
      bestScore,
      bestNormalizedQuestion,
    });
  };

  if (!best || (best.score || 0) < cacheThreshold) {
    logMiss(!best ? "NO_MATCH_ABOVE_THRESHOLD" : "BELOW_THRESHOLD");
    return null;
  }

  const cacheId = best.metadata?.cacheId as string | undefined;
  if (cacheId) {
    const cacheDoc = await cacheRepository.findByIdLean(cacheId);
    if (cacheDoc) {
      return cacheDoc;
    }

    log({ evt: "rag.cache_stale", cacheId, userId });

    try {
      await deleteVectors(RAG_CONSTANTS.cacheNamespace, [cacheVectorId(cacheId, userId)]);
    } catch (error) {
      log({ evt: "rag.cache_stale_delete_failed", cacheId, userId, error: String(error) });
    }
    logMiss("STALE_CACHE");
  }

  const normalizedQuestion = best.metadata?.normalizedQuestion as string | undefined;
  if (normalizedQuestion) {
    const docByNormalized = await cacheRepository.findByNormalizedQuestion(
      userId,
      normalizedQuestion
    );
    if (docByNormalized) {
      return docByNormalized;
    }
  }

  logMiss("MONGO_LOOKUP_MISS");
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
        refusal: doc.refusal,
      },
    },
  ]);
};

export { storeCacheHit, findCacheHit };
