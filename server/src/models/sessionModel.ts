import { Schema, model } from "mongoose";
import { ONE_WEEK_IN_SECONDS } from "../constants/Constants";

export type SessionType = "login" | "workout" | "auth_refresh" | string;

export interface IRefreshSessionData {
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  ip?: string;
  device?: string;
}

export interface ISession {
  _id?: string;
  userId: string;
  type: SessionType;
  data?: Record<string, unknown> | IRefreshSessionData;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISessionCreate extends Partial<ISession> {}

const sessionSchema = new Schema<ISession>({
  userId: { type: String, required: true },
  type: { type: String, required: true },
  data: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now, immutable: true },
  updatedAt: { type: Date, default: Date.now },
});

sessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: ONE_WEEK_IN_SECONDS });

const Session = model<ISession>("Session", sessionSchema);

export default Session;
