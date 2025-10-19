import { IRagCacheEntry } from "../models/ragCacheModel";
import { RAG_CONSTANTS } from "./config";
import { getRagCacheRepository } from "./db";
import { queryPinecone, buildMetadataFilter, upsertVectors } from "./pinecone";

const cacheRepository = getRagCacheRepository();

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

export { storeCacheHit, findCacheHit };
