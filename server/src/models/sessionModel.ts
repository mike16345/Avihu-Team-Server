import { Schema, model, Document } from "mongoose";
import { MINIMUM_WORKOUT_SESSION_TIMEOUT, ONE_MINUTE } from "../constants/Constants";

export type SessionType = "login" | "workout" | string;

interface ISession extends Document {
  userId: string;
  type: SessionType;
  data?: any; // Additional session-specific data
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>({
  userId: Schema.Types.ObjectId,
  type: { type: String, required: true },
  data: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now, immutable: true },
  updatedAt: { type: Date, default: Date.now },
});

sessionSchema.index(
  { updatedAt: 1 },
  { expireAfterSeconds: MINIMUM_WORKOUT_SESSION_TIMEOUT * ONE_MINUTE }
);

const Session = model<ISession>("Session", sessionSchema);

export default Session;
