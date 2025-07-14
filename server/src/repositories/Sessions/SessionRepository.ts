import { Document, Types } from "mongoose";
import Session, { ISession } from "../../models/sessionModel";
import { FindOptionsNoQuery } from "../../types/mongooseTypes";
import { BaseRepository } from "../BaseRepository";

export class SessionRepository extends BaseRepository<ISession> {
  constructor() {
    super(Session);
  }

  async getSessionById(id: string, options?: FindOptionsNoQuery<ISession> | undefined) {
    return await this.model.findById(id, options);
  }
}
