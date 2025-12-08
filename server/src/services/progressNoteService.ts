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
      const progressNotesRecord = await this.repository.addProgressNote(userId, note);

      this.cache.invalidateAllContaining(userId);

      return progressNotesRecord;
    } catch (error) {
      throw error;
    }
  }

  async updateProgressNote(userId: string, noteId: string, note: IProgressNote) {
    try {
      const objectId = new mongoose.mongo.ObjectId(noteId);

      const progressNoteDoc = await this.repository.updateProgressNote(userId, objectId, note);

      this.cache.invalidateAllContaining(userId);

      return progressNoteDoc;
    } catch (error) {
      throw error;
    }
  }

  async getProgressNotesByUserId(userId: string) {
    const cached = this.cache.get(userId);

    if (cached) return cached;

    try {
      const progressNotesRecord: IProgressNotes = await this.repository.findOne({
        query: { userId },
      });

      progressNotesRecord.progressNotes.sort((a, b) => b.date - a.date);
      this.cache.set(userId, progressNotesRecord);

      return progressNotesRecord;
    } catch (err: any) {
      throw err;
    }
  }

  async removeProgressNote(userId: string, noteId: string) {
    try {
      const objectId = new mongoose.mongo.ObjectId(noteId);
      const deletedProgressNote = this.repository.removeProgressNote(userId, objectId);

      this.cache.invalidateAllContaining(userId);

      return deletedProgressNote;
    } catch (error) {
      throw error;
    }
  }
}
