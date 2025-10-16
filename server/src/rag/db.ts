import { RagCacheRepository } from "../repositories/Rag/RagCacheRepository";
import { RagTraceRepository } from "../repositories/Rag/RagTraceRepository";
import { RagRateLimitRepository } from "../repositories/Rag/RagRateLimitRepository";
import { RagSourceRepository } from "../repositories/Rag/RagSourceRepository";

const ragCacheRepository = new RagCacheRepository();
const ragTraceRepository = new RagTraceRepository();
const ragRateLimitRepository = new RagRateLimitRepository();
const ragSourceRepository = new RagSourceRepository();

export const getRagCacheRepository = () => ragCacheRepository;
export const getRagTraceRepository = () => ragTraceRepository;
export const getRagRateLimitRepository = () => ragRateLimitRepository;
export const getRagSourceRepository = () => ragSourceRepository;
