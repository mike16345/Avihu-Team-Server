import { createHash } from "crypto";
import { createEmbedding } from "./openai";
import { normalizeText } from "./text";
import { RagIngestChunk } from "./types";
import { getRagSourceRepository } from "./db";

const sourceRepository = getRagSourceRepository();

const computeHash = (text: string) =>
  createHash("sha256").update(normalizeText(text)).digest("hex");

const prepareChunks = async (chunks: RagIngestChunk[], userId: string) => {
  return await Promise.all(
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
};

export { prepareChunks };
