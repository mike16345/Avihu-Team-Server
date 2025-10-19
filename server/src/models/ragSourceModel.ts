import { Schema, model } from "mongoose";

export interface IRagSourceChunk {
  userId: string;
  sourceId: string;
  chunkId: string;
  text: string;
  hash: string;
  metadata?: Record<string, any>;
  lang: string;
  visibility: "private" | "shared";
  createdAt: Date;
  updatedAt: Date;
}

const ragSourceSchema = new Schema<IRagSourceChunk>(
  {
    userId: { type: String, required: true, index: true },
    sourceId: { type: String, required: true, index: true },
    chunkId: { type: String, required: true },
    text: { type: String, required: true },
    hash: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    lang: { type: String, default: "en" },
    visibility: { type: String, enum: ["private", "shared"], default: "private" },
  },
  { timestamps: true }
);

ragSourceSchema.index({ userId: 1, sourceId: 1, chunkId: 1 }, { unique: true });
ragSourceSchema.index({ hash: 1, userId: 1 });

const RagSourceModel = model<IRagSourceChunk>("RagSource", ragSourceSchema);

export default RagSourceModel;
