import { StatusCode } from "../enums/StatusCode";
import RagRateLimitModel from "../models/ragRateLimitModel";
import type { IRagRateLimit } from "../models/ragRateLimitModel";
import { RAG_CONSTANTS } from "./config";

const ensureRateLimit = async (userId: string) => {
  const now = new Date();
  const windowStart = new Date(now.getTime() - RAG_CONSTANTS.rateLimitWindowMs);

  const updatedRecord = await RagRateLimitModel.findOneAndUpdate(
    { userId },
    [
      {
        $setOnInsert: {
          userId,
          events: [],
          createdAt: now,
        },
      },
      {
        $set: {
          events: {
            $filter: {
              input: "$events",
              as: "event",
              cond: { $gt: ["$$event", windowStart] },
            },
          },
        },
      },
      {
        $set: {
          withinLimit: {
            $lt: [{ $size: "$events" }, RAG_CONSTANTS.rateLimitMaxRequests],
          },
        },
      },
      {
        $set: {
          events: {
            $cond: ["$withinLimit", { $concatArrays: ["$events", [now]] }, "$events"],
          },
          updatedAt: now,
        },
      },
      {
        $set: {
          createdAt: { $ifNull: ["$createdAt", now] },
        },
      },
      {
        $unset: "withinLimit",
      },
    ],
    { new: true, upsert: true }
  );

  const events = ((updatedRecord as unknown as IRagRateLimit | null)?.events || []) as Date[];
  const inserted = events.some((event) => new Date(event).getTime() === now.getTime());

  if (!inserted) {
    throw { status: StatusCode.TOO_MANY_REQUESTS, message: "rate limit exceeded" };
  }
};

export { ensureRateLimit };
