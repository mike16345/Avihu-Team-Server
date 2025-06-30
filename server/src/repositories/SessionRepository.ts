import Session, { ISession } from "../models/sessionModel";
import { BaseRepository } from "./BaseRepository";

export class SessionRepository extends BaseRepository<ISession> {
  constructor() {
    super(Session);
  }

}
