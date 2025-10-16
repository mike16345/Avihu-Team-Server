import { Schema, model } from "mongoose";

export interface IRagCitation {
  marker: string;
  sourceId: string;
  page?: number;
  score?: number;
}

export interface IRagCacheEntry {
  userId: string;
  question: string;
  normalizedQuestion: string;
  answer: string;
  language: "he" | "en";
  citations: IRagCitation[];
  retrievedIds: string[];
  topScore: number;
  embedding: number[];
  refusal: boolean;
  notice?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ragCacheSchema = new Schema<IRagCacheEntry>(
  {
    userId: { type: String, required: true, index: true },
    question: { type: String, required: true },
    normalizedQuestion: { type: String, required: true },
    answer: { type: String, required: true },
    language: { type: String, enum: ["he", "en"], required: true },
    citations: [
      {
        marker: { type: String, required: true },
        sourceId: { type: String, required: true },
        page: { type: Number },
        score: { type: Number },
      },
    ],
    retrievedIds: { type: [String], default: [] },
    topScore: { type: Number, default: 0 },
    embedding: { type: [Number], default: [] },
    refusal: { type: Boolean, default: false },
    notice: { type: String },
  },
  { timestamps: true }
);

ragCacheSchema.index({ userId: 1, normalizedQuestion: 1 }, { unique: true });
ragCacheSchema.index({ updatedAt: -1 });

const RagCacheModel = model<IRagCacheEntry>("RagCache", ragCacheSchema);

export default RagCacheModel;
