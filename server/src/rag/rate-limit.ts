import { StatusCode } from "../enums/StatusCode";
import RagRateLimitModel from "../models/ragRateLimitModel";
import type { IRagRateLimit } from "../models/ragRateLimitModel";
import { RAG_CONSTANTS } from "./config";

const ensureRateLimit = async (userId: string) => {
  const now = new Date();
  const windowStart = new Date(now.getTime() - RAG_CONSTANTS.rateLimitWindowMs);

  // 1. Load current record (if any)
  const existing = await RagRateLimitModel.findOne({ userId }).lean<IRagRateLimit | null>();

  // 2. Normalize + trim events to the active window
  let events: Date[] = (existing?.events ?? []).map((e) => new Date(e));
  events = events.filter((event) => event > windowStart);

  // 3. Check limit *before* adding this request
  if (events.length >= RAG_CONSTANTS.rateLimitMaxRequests) {
    throw { status: StatusCode.TOO_MANY_REQUESTS, message: "rate limit exceeded" } as const;
  }

  // 4. Add current event
  events.push(now);

  // 5. Upsert back (no pipeline, so $setOnInsert is valid)
  await RagRateLimitModel.findOneAndUpdate(
    { userId },
    {
      $setOnInsert: {
        userId,
        createdAt: now,
      },
      $set: {
        events,
        updatedAt: now,
      },
    },
    { new: false, upsert: true }
  );
};

export { ensureRateLimit };
