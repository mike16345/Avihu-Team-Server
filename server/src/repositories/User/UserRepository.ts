import { IUser } from "../../interfaces/IUser";
import { User } from "../../models/userModel";
import { BaseRepository } from "../BaseRepository";

export default class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User, { type: "trainer", field: "trainerId" });
  }
}

export class GlobalUserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User, { type: "global" });
  }
}
