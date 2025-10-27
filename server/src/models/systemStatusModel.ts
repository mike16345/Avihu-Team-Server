import { Schema, model, InferSchemaType } from "mongoose";

const SystemStatusSchema = new Schema(
  {
    key: { type: String, required: true, unique: true }, // always "system"
    paused: { type: Boolean, default: false },
    message: { type: String, default: "" },
    updatedAt: { type: Date, default: () => new Date() },
  },
  { versionKey: false }
);

export type ISystemStatus = InferSchemaType<typeof SystemStatusSchema>;
export default model<ISystemStatus>("SystemStatus", SystemStatusSchema);
