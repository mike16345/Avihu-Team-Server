import Session, { ISession, ISessionCreate, SessionType } from "../models/sessionModel";
import { Cache } from "../utils/cache";

const sessionCache = new Cache<any>();

const isSessionExpired = (session: ISession): boolean => {
  const now = new Date().getTime();

  if (session.type === "login") {
    const loginExpiration = session.updatedAt.getTime() + 7 * 24 * 60 * 60 * 1000; // 7 days in ms

    return now > loginExpiration;
  } else if (session.type === "workout") {
    const workoutExpiration = session.updatedAt.getTime() + 2 * 60 * 60 * 1000; // 2 hours in ms

    return now > workoutExpiration;
  }

  return false;
};

export default class SessionService {
  static async startSession(session: ISessionCreate) {
    try {
      const sessionDoc = await Session.create(session);
      sessionCache.invalidateAll();

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
      sessionCache.invalidate(sessionId);

      return updatedSession;
    } catch (e) {
      throw e;
    }
  }

  static async getSessionById(sessionId: string) {
    try {
      const session = await Session.findById(sessionId);

      if (!session) return null;

      if (isSessionExpired(session)) {
        await Session.deleteOne(session._id);
        return null;
      }
      sessionCache.set(sessionId, session);

      return session;
    } catch (err) {
      throw err;
    }
  }

  static async getSessionsByUserId(userId: string) {
    const cacheKey = `sessions_user_${userId}`;
    const cachedSessions = sessionCache.get(cacheKey);
    if (cachedSessions) {
      return cachedSessions;
    }

    try {
      const sessions = await Session.find({ userId });

      sessionCache.set(cacheKey, sessions);
      return sessions;
    } catch (e) {
      throw e;
    }
  }

  static async getSessionsByType(type: SessionType) {
    const cacheKey = `sessions_type_${type}`;
    const cachedSessions = sessionCache.get(cacheKey);
    if (cachedSessions) {
      return cachedSessions;
    }

    try {
      const sessions = await Session.find({ type });
      sessionCache.set(cacheKey, sessions);

      return sessions;
    } catch (e) {
      throw e;
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

      if (result) {
        sessionCache.invalidate(sessionId); // Invalidate cache for the updated session
          sessionCache.invalidateAll(); // Optionally invalidate all sessions 
      }

      return result;
    } catch (err) {
      throw err;
    }
  }

  static async endSession(sessionId: string) {
    try {
      const result = await Session.findByIdAndDelete(sessionId);
      if (result) {
        sessionCache.invalidate(sessionId); // Invalidate cache when session is deleted
        sessionCache.invalidateAll(); // Optionally invalidate all sessions cache
      }
      return result;
    } catch (err) {
      throw err;
    }
  }

  static async expireSessions() {
    const expirationTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes

    try {
      await Session.deleteMany({ lastActivityTime: { $lt: expirationTime } });
      sessionCache.invalidateAll(); // Invalidate all cache after deleting expired sessions
    } catch (err) {
      throw err;
    }
  }

  static async endAllSessions() {
    try {
      const result = await Session.deleteMany({});
      sessionCache.invalidateAll(); // Invalidate all session caches
      return result;
    } catch (err) {
      throw err;
    }
  }
}
