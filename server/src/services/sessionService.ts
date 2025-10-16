import { ISession, ISessionCreate } from "../models/sessionModel";
import { SessionRepository } from "../repositories/Sessions/SessionRepository";
import { removeExpiredMeals } from "../utils/meals";
import { BaseService } from "./BaseService";

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

const RESOURCE_NAME = "sessions";

export default class SessionService extends BaseService<ISession, SessionRepository> {
  constructor() {
    super(new SessionRepository(), RESOURCE_NAME);
  }

  async refreshSession(sessionId: string) {
    try {
      const updateOptions = {
        update: { updatedAt: new Date() },
        options: { new: true },
      };
      const updatedSession = await this.repository.updateById(sessionId, updateOptions);
      this.cache.invalidate(sessionId);

      return updatedSession;
    } catch (e) {
      throw e;
    }
  }

  async getSessionById(sessionId: string) {
    try {
      let session = this.cache.get(sessionId) || (await this.repository.getSessionById(sessionId));

      if (!session) return null;
      if (isSessionExpired(session)) {
        this.cache.invalidate(sessionId);
        await this.repository.deleteById(String(session._id));
        return null;
      }

      if (session.type == "meals") {
        const newSession = removeExpiredMeals(session);
        const updateOptions = {
          update: { data: newSession, updatedAt: new Date() },
          options: { new: true },
        };
        session = await this.repository.updateById(session._id.toString(), updateOptions);
      }
      this.cache.set(sessionId, session);
      console.log("returning session", session);

      return session;
    } catch (err) {
      throw err;
    }
  }

  async updateSessionById(sessionId: string, sessionDetails: ISessionCreate) {
    try {
      const updateOptions = {
        update: {
          ...sessionDetails,
          updatedAt: new Date(),
        },
        options: { new: true },
      };
      const result = await this.repository.updateById(sessionId, updateOptions);

      if (result) this.cache.invalidateAll();

      return result;
    } catch (err) {
      throw err;
    }
  }
}
