import mongoose, { HydratedDocument } from "mongoose";
import { IProgressNote, IProgressNotes } from "../../interfaces/userProgress";
import { ProgressNote } from "../../models/progressNotes";
import { BaseRepository } from "../BaseRepository";

export class ProgressNotesRepository extends BaseRepository<IProgressNotes> {
  constructor() {
    super(ProgressNote);
  }

  async findOrCreate(userId: mongoose.Types.ObjectId) {
    let record =
      (await this.model.findOne({ userId })) || new this.model({ userId, progressNotes: [] });

    return record;
  }

  appendProgressNote(record: HydratedDocument<IProgressNotes>, note: IProgressNote) {
    record.progressNotes.push(note);
    record.markModified("progressNotes");
  }

  updateProgressNote(
    record: HydratedDocument<IProgressNotes>,
    noteId: mongoose.Types.ObjectId,
    note: IProgressNote
  ) {
    const target = record.progressNotes.find((progressNote) => progressNote._id?.equals(noteId));

    if (target) {
      Object.assign(target, note);
      record.markModified("progressNotes");
    }
  }

  removeProgressNote = async (
    record: HydratedDocument<IProgressNotes>,
    progressNoteId: mongoose.Types.ObjectId
  ) => {
    record.progressNotes.filter((note: IProgressNote) => note._id !== progressNoteId);
    record.markModified("userProgressNote");
  };
}
