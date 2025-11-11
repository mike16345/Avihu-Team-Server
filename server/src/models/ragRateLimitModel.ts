import { Schema, model } from "mongoose";

export interface IRagRateLimit {
  userId: string;
  events: Date[];
  createdAt: Date;
  updatedAt: Date;
}

const ragRateLimitSchema = new Schema<IRagRateLimit>(
  {
    userId: { type: String, required: true, unique: true },
    events: { type: [Date], default: [] },
  },
  { timestamps: true }
);

const RagRateLimitModel = model<IRagRateLimit>("RagRateLimit", ragRateLimitSchema);

export default RagRateLimitModel;
