import { Pinecone } from "@pinecone-database/pinecone";
import { getPineconeIndexName, RAG_CONSTANTS } from "./config";

let cachedClient: Pinecone | null = null;

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

const getIndex = () => {
  const client = getClient();
  const indexName = getPineconeIndexName();
  return client.index(indexName);
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
  const index = getIndex();
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

  const index = getIndex();
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

  const index = getIndex();
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
