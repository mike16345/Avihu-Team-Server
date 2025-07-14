import mongoose from "mongoose";
import { IPassword, Password } from "../../models/passwordModel";
import { BaseRepository } from "../BaseRepository";

export default class PasswordRepository extends BaseRepository<IPassword> {
  constructor() {
    super(Password);
  }

  createByUser(doc: IPassword, userId: string) {
    return this.model.findOneAndUpdate({ userId: new mongoose.mongo.ObjectId(userId) }, doc, {
      upsert: true,
      new: true,
    });
  }
}
