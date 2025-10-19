import { StatusCode } from "../enums/StatusCode";
import RagRateLimitModel, { IRagRateLimit } from "../models/ragRateLimitModel";
import { RAG_CONSTANTS } from "./config";
import { getRagRateLimitRepository } from "./db";

const rateLimitRepository = getRagRateLimitRepository();

const ensureRateLimit = async (userId: string) => {
  const now = new Date();
  const windowStart = new Date(now.getTime() - RAG_CONSTANTS.rateLimitWindowMs);

  let record: IRagRateLimit | null = null;

  try {
    record = await RagRateLimitModel.findOne({ userId }).lean();
  } catch (error) {
    record = null;
  }

  const filteredEvents = (record?.events || []).filter((event) => event > windowStart);

  if (filteredEvents.length >= RAG_CONSTANTS.rateLimitMaxRequests) {
    throw { status: StatusCode.TOO_MANY_REQUESTS, message: "rate limit exceeded" };
  }

  filteredEvents.push(now);

  if (record) {
    await rateLimitRepository.updateOne({
      filter: { userId } as any,
      update: {
        events: filteredEvents,
        updatedAt: now,
      } as any,
    });
  } else {
    await rateLimitRepository.create({
      userId,
      events: filteredEvents,
      createdAt: now,
      updatedAt: now,
    } as any);
  }
};

export { ensureRateLimit };
