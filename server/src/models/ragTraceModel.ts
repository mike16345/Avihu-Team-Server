import { Schema, model } from "mongoose";

export interface IRagTrace {
  userId: string;
  sessionId?: string;
  question: string;
  language: string;
  retrievedIds: string[];
  reason: string;
  answerPreview: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ragTraceSchema = new Schema<IRagTrace>(
  {
    userId: { type: String, required: true, index: true },
    sessionId: { type: String },
    question: { type: String, required: true },
    language: { type: String, required: true },
    retrievedIds: { type: [String], default: [] },
    reason: { type: String, required: true },
    answerPreview: { type: String, required: true },
    usage: {
      promptTokens: Number,
      completionTokens: Number,
      totalTokens: Number,
    },
  },
  { timestamps: true }
);

ragTraceSchema.index({ createdAt: -1 });

const RagTraceModel = model<IRagTrace>("RagTrace", ragTraceSchema);

export default RagTraceModel;
