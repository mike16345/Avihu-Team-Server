import mongoose, { HydratedDocument } from "mongoose";
import { IProgressNote, IUserProgressNotes } from "../../interfaces/userProgress";
import { UserProgressNote } from "../../models/userProgressNotes";
import { BaseRepository } from "../BaseRepository";

export class UserProgressNotesRepository extends BaseRepository<IUserProgressNotes> {
  constructor() {
    super(UserProgressNote);
  }

  async findOrCreate(userId: mongoose.Types.ObjectId) {
    let record =
      (await this.model.findOne({ userId })) || new this.model({ userId, progressNotes: [] });

    return record;
  }

  appendProgressNote(record: HydratedDocument<IUserProgressNotes>, note: IProgressNote) {
    record.progressNotes.push(note);
    record.markModified("userProgressNote");
  }

  removeProgressNote = async (
    record: HydratedDocument<IUserProgressNotes>,
    progressNoteId: mongoose.Types.ObjectId
  ) => {
    record.progressNotes.filter((note) => note._id !== progressNoteId);
    record.markModified("userProgressNote");
  };
}
