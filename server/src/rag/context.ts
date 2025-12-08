import { RAG_CONSTANTS } from "./config";
import { PineconeMatch } from "./pinecone";
import { summariseSentences } from "./text";
import { Citation } from "./types";

const toCitations = (matches: PineconeMatch[]): Citation[] =>
  matches.map((match, index) => ({
    marker: `[^${index + 1}]`,
    sourceId: String(match.metadata?.sourceId || match.id),
    page: match.metadata?.page,
    score: match.score,
  }));

const toContextBlocks = (matches: PineconeMatch[]): string[] =>
  matches.map((match, index) => {
    const text = match.metadata?.text || "";
    return `[${index + 1}] ${summariseSentences(text, RAG_CONSTANTS.minContextSentences)}`;
  });

export { toCitations, toContextBlocks };
