import { Schema, model, InferSchemaType } from "mongoose";

const RagDailyQuotaSchema = new Schema(
  {
    userId: { type: String, index: true, required: true },
    date: { type: String, index: true, required: true }, // "YYYY-MM-DD" in UTC
    count: { type: Number, required: true, default: 0 },
    updatedAt: { type: Date, default: () => new Date() },
  },
  { versionKey: false }
);

RagDailyQuotaSchema.index({ userId: 1, date: 1 }, { unique: true });

export type IRagDailyQuota = InferSchemaType<typeof RagDailyQuotaSchema>;
export default model<IRagDailyQuota>("RagDailyQuota", RagDailyQuotaSchema);
