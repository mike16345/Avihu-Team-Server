import { BaseService } from "./BaseService";
import { IProgressNote, IProgressNotes } from "../interfaces/userProgress";
import { ProgressNotesRepository } from "../repositories/ProgressNotes/ProgressNotesRepository";
import mongoose from "mongoose";

const RESOURCE_NAME = "progress-note";

export class ProgressNoteService extends BaseService<IProgressNotes, ProgressNotesRepository> {
  constructor() {
    super(new ProgressNotesRepository(), RESOURCE_NAME);
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

  async updateProgressNote(userId: string, noteId: string, note: IProgressNote) {
    try {
      const objectUserId = new mongoose.mongo.ObjectId(userId);
      const objectNoteId = new mongoose.mongo.ObjectId(noteId);
      const progressNotesRecord = await this.repository.findOrCreate(objectUserId);
      this.repository.updateProgressNote(progressNotesRecord, objectNoteId, note);
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
