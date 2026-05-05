import Session, { IRefreshSessionData, ISession } from "../../models/sessionModel";
import { FindOptionsNoQuery } from "../../types/mongooseTypes";
import { BaseRepository } from "../BaseRepository";

export class SessionRepository extends BaseRepository<ISession> {
  constructor() {
    super(Session);
  }

  async getSessionById(id: string, options?: FindOptionsNoQuery<ISession> | undefined) {
    return await this.model.findById(id, options);
  }

  async findRefreshSessionByHash(tokenHash: string): Promise<ISession | null> {
    return this.model.findOne({ type: "auth_refresh", "data.tokenHash": tokenHash }).lean();
  }

  async revokeRefreshSession(session: ISession): Promise<void> {
    const refreshData = session.data as IRefreshSessionData;
    await this.updateById(String(session._id), {
      update: {
        data: { ...refreshData, revokedAt: new Date() },
        updatedAt: new Date(),
      },
      options: { new: true },
    });
  }
}
