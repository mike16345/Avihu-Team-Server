import { getPineconeIndexName, RAG_CONSTANTS } from "./config";

const PINECONE_CONTROL_URL = "https://api.pinecone.io";

const getApiKey = () => {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing PINECONE_API_KEY");
  }
  return apiKey;
};

const baseHeaders = () => ({
  "Api-Key": getApiKey(),
  "Content-Type": "application/json",
});

let cachedHost: string | null = null;

const fetchIndexHost = async (): Promise<string> => {
  if (cachedHost) {
    return cachedHost;
  }
  const indexName = getPineconeIndexName();
  const response = await fetch(`${PINECONE_CONTROL_URL}/indexes/${indexName}`, {
    method: "GET",
    headers: baseHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch Pinecone host: ${errorText}`);
  }

  const payload = await response.json();
  const host = payload?.index?.host || payload?.host || payload?.status?.host;
  if (!host) {
    throw new Error("Pinecone host not found in response");
  }
  cachedHost = host;
  return host;
};

const pineconeFetch = async (path: string, body: any) => {
  const host = await fetchIndexHost();
  const response = await fetch(`https://${host}${path}`, {
    method: "POST",
    headers: baseHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pinecone error: ${errorText}`);
  }

  return response.json();
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

export const queryPinecone = async (
  options: QueryOptions
): Promise<PineconeMatch[]> => {
  const payload = {
    namespace: options.namespace,
    topK: options.topK,
    vector: options.vector,
    filter: options.filter,
    includeMetadata: true,
  };
  const data = await pineconeFetch("/query", payload);
  return (data?.matches as PineconeMatch[]) || [];
};

export const upsertVectors = async (
  namespace: string,
  vectors: UpsertVector[]
) => {
  const payload = {
    namespace,
    vectors,
  };
  await pineconeFetch("/vectors/upsert", payload);
};

export const deleteVectors = async (namespace: string, ids: string[]) => {
  const payload = {
    namespace,
    ids,
  };
  await pineconeFetch("/vectors/delete", payload);
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
