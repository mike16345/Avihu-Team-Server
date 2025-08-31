import { BaseService } from "./BaseService";
import { IProgressNote, IUserProgressNotes } from "../interfaces/userProgress";
import { UserProgressNotesRepository } from "../repositories/UserProgressNotes/UserProgressNotesRepository";
import mongoose from "mongoose";

const RESOURCE_NAME = "user-progress-note";

export class UserProgressNoteService extends BaseService<
  IUserProgressNotes,
  UserProgressNotesRepository
> {
  constructor() {
    super(new UserProgressNotesRepository(), RESOURCE_NAME);
  }

  async addProgressNote(userId: string, note: IProgressNote) {
    try {
      const objectId = new mongoose.mongo.ObjectId(userId);
      const progressNotesRecord = await this.repository.findOrCreate(objectId);
      this.repository.appendProgressNote(progressNotesRecord, note);
      await progressNotesRecord.save();

      this.cache.invalidateAllContaining(userId);

      return progressNotesRecord;
    } catch (error) {
      throw error;
    }
  }

  async getProgressNotesByUserId(userId: string) {
    try {
      const cacheKey = userId;
      const progressNotesRecord =
        this.cache.get(cacheKey) || (await this.repository.find({ query: { userId } }));

      this.cache.set(cacheKey, progressNotesRecord);

      return progressNotesRecord;
    } catch (err: any) {
      throw err;
    }
  }

  async removeProgressNote(userId: string, noteId: string) {
    try {
      const objectId = new mongoose.mongo.ObjectId(noteId);
      const cacheKey = userId;
      const progressNotesRecord =
        this.cache.get(cacheKey) || (await this.repository.find({ query: { userId } }));

      this.repository.removeProgressNote(progressNotesRecord, objectId);

      this.cache.invalidateAllContaining(userId);
    } catch (error) {
      throw error;
    }
  }
}
