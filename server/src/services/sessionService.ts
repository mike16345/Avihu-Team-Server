import Session, { SessionType } from "../models/sessionModel";
import mongoose from "mongoose";

export default class SessionService {
  static async startSession(userId: string, type: SessionType) {
    const session = await Session.create({
      userId: new mongoose.Types.ObjectId(userId),
      type,
    });

    return session;
  }

  static async getSessionById(sessionId: string) {
    try {
      const session = await Session.findById(sessionId);

      return session;
    } catch (err) {
      throw err;
    }
  }

  static async updateSession(sessionId: string) {
    try {
      await Session.findByIdAndUpdate(sessionId, { updatedAt: new Date() });
    } catch (err) {
      throw err;
    }
  }

  static async endSession(sessionId: string) {
    try {
      return await Session.findByIdAndDelete(sessionId);
    } catch (err) {
      throw err;
    }
  }

  static async expireSessions() {
    const expirationTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes

    await Session.deleteMany({ lastActivityTime: { $lt: expirationTime } });
  }
}
