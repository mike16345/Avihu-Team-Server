import Session, { ISessionCreate, SessionType } from "../models/sessionModel";
import mongoose from "mongoose";

export default class SessionService {
  static async startSession(session: ISessionCreate) {
    try {
      const sessionDoc = await Session.create(session);

      return sessionDoc;
    } catch (e) {
      throw e;
    }
  }

  static async refreshSession(sessionId: string) {
    try {
      const updatedSession = await Session.findByIdAndUpdate(
        sessionId,
        { updatedAt: new Date() },
        { new: true }
      );

      return updatedSession;
    } catch (e) {
      throw e;
    }
  }

  static async getSessionsByUserId(userId: string) {
    try {
      const sessions = await Session.find({ userId });

      return sessions;
    } catch (e) {
      throw e;
    }
  }

  static async getSessionsByType(type: SessionType) {
    try {
      const sessions = await Session.find({ type });

      return sessions;
    } catch (e) {
      throw e;
    }
  }
  static async getSessions() {
    try {
      const sessions = await Session.find();

      return sessions;
    } catch (e) {
      throw e;
    }
  }

  static async getSessionById(sessionId: string) {
    try {
      const session = await Session.findById(sessionId);

      return session;
    } catch (err) {
      throw err;
    }
  }

  static async updateSession(sessionId: string, sessionDetails: ISessionCreate) {
    try {
      const result = await Session.findByIdAndUpdate(
        sessionId,
        {
          ...sessionDetails,
          updatedAt: new Date(),
        },
        { new: true }
      );

      return result;
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

  static async endAllSessions() {
    try {
      return await Session.deleteMany({});
    } catch (err) {
      throw err;
    }
  }
}
