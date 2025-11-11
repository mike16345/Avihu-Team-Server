import { getRagTraceRepository } from "./db";
import { UsageMetrics } from "./openai";
import { RagReason } from "./types";

const traceRepository = getRagTraceRepository();

const logTrace = async (
  userId: string,
  question: string,
  language: string,
  reason: RagReason,
  answer: string,
  retrievedIds: string[],
  usage?: UsageMetrics,
  sessionId?: string
) => {
  const preview = answer.length > 280 ? `${answer.slice(0, 277)}...` : answer;
  await traceRepository.create({
    userId,
    sessionId,
    question,
    language,
    reason,
    retrievedIds,
    answerPreview: preview,
    usage,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any);
};

export { logTrace };
