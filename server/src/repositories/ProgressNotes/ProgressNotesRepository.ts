import mongoose, { HydratedDocument } from "mongoose";
import { IProgressNote, IProgressNotes } from "../../interfaces/userProgress";
import { ProgressNote } from "../../models/progressNotes";
import { BaseRepository } from "../BaseRepository";
import { StatusCode } from "../../enums/StatusCode";
import { DELETE_FAILURE } from "../../constants/repository";

export class ProgressNotesRepository extends BaseRepository<IProgressNotes> {
  constructor() {
    super(ProgressNote);
  }

  async addProgressNote(userId: string, note: IProgressNote) {
    const progressNoteDoc = await this.model.findOneAndUpdate(
      { userId },
      { $push: { progressNotes: note } },
      { new: true, upsert: true }
    );

    return progressNoteDoc;
  }

  async updateProgressNote(userId: string, noteId: mongoose.Types.ObjectId, note: IProgressNote) {
    const progressNoteDoc = await this.model.findOneAndUpdate(
      { userId, "progressNotes._id": noteId },
      { $set: { "progressNotes.$": note } },
      { new: true }
    );

    return progressNoteDoc;
  }

  removeProgressNote = async (userId: string, progressNoteId: mongoose.Types.ObjectId) => {
    const result = await this.model.findOneAndUpdate(
      { userId },
      { $pull: { progressNotes: { _id: progressNoteId } } },
      { new: true }
    );
    if (!result) throw { status: StatusCode.NOT_FOUND, message: DELETE_FAILURE };

    return result;
  };
}
