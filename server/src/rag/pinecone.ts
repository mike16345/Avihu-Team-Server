import { Pinecone } from "@pinecone-database/pinecone";
import { getPineconeIndexName, RAG_CONSTANTS } from "./config";

type PineconeIndex = ReturnType<Pinecone["index"]>;

let cachedClient: Pinecone | null = null;
let cachedIndexPromise: Promise<PineconeIndex> | null = null;
let embeddingDimensionChecked = false;

const getClient = () => {
  if (cachedClient) {
    return cachedClient;
  }

  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing PINECONE_API_KEY");
  }

  cachedClient = new Pinecone({ apiKey });
  return cachedClient;
};

const resolveIndexDimension = (description: any): number | undefined => {
  if (!description || typeof description !== "object") {
    return undefined;
  }

  if (typeof description.dimension === "number") {
    return description.dimension;
  }

  if (description.database && typeof description.database.dimension === "number") {
    return description.database.dimension;
  }

  if (description.spec && typeof description.spec.dimension === "number") {
    return description.spec.dimension;
  }

  if (description.status && typeof description.status.dimension === "number") {
    return description.status.dimension;
  }

  return undefined;
};

const ensureEmbeddingDimensionConsistency = async (
  client: Pinecone,
  indexName: string
) => {
  if (embeddingDimensionChecked) {
    return;
  }

  const description = await client.describeIndex(indexName);
  const indexDimension = resolveIndexDimension(description);
  const expected = RAG_CONSTANTS.embeddingDimensions;

  if (typeof indexDimension === "number" && indexDimension !== expected) {
    throw new Error(
      `Pinecone index dimension (${indexDimension}) != embedding result dimension (${expected})`
    );
  }

  embeddingDimensionChecked = true;
};

const getIndex = async (): Promise<PineconeIndex> => {
  if (!cachedIndexPromise) {
    cachedIndexPromise = (async () => {
      const client = getClient();
      const indexName = getPineconeIndexName();
      await ensureEmbeddingDimensionConsistency(client, indexName);
      return client.index(indexName);
    })();
  }

  return cachedIndexPromise;
};

export type PineconeMatch = {
  id: string;
  score: number;
  metadata?: Record<string, any>;
  values?: number[];
};

export type QueryOptions = {
  namespace: string;
  vector: number[];
  topK: number;
  filter?: Record<string, any>;
};

export type UpsertVector = {
  id: string;
  values: number[];
  metadata?: Record<string, any>;
};

export const queryPinecone = async (options: QueryOptions): Promise<PineconeMatch[]> => {
  const index = await getIndex();
  const namespace = index.namespace(options.namespace);
  const response = await namespace.query({
    topK: options.topK,
    vector: options.vector,
    filter: options.filter,
    includeMetadata: true,
  });

  return (response.matches as PineconeMatch[]) || [];
};

export const upsertVectors = async (namespace: string, vectors: UpsertVector[]) => {
  if (!vectors.length) {
    return;
  }

  const index = await getIndex();
  const namespaceClient = index.namespace(namespace);
  const payload = vectors.map((vector) => ({
    id: vector.id,
    values: vector.values,
    metadata: vector.metadata,
  }));

  await namespaceClient.upsert(payload);
};

export const deleteVectors = async (namespace: string, ids: string[]) => {
  if (!ids.length) {
    return;
  }

  const index = await getIndex();
  const namespaceClient = index.namespace(namespace);
  const deleteMany = (namespaceClient as any).deleteMany as
    | ((ids: string[]) => Promise<void>)
    | undefined;

  if (deleteMany) {
    await deleteMany(ids);
    return;
  }

  await namespaceClient.delete({ ids });
};

export const buildMetadataFilter = (
  userId: string,
  language: string,
  additionalFilter?: Record<string, any>
) => {
  const baseFilter: Record<string, any> = {
    userId,
  };

  if (language) {
    baseFilter.lang = language;
  }

  if (additionalFilter && Object.keys(additionalFilter).length > 0) {
    Object.assign(baseFilter, additionalFilter);
  }

  return baseFilter;
};

export const trimMatches = (matches: PineconeMatch[]) =>
  matches
    .filter((match) => typeof match.score === "number")
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, RAG_CONSTANTS.maxContextChunks);
