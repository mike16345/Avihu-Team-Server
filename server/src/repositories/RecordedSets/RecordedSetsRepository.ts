import { IRecordedSet } from "../../interfaces/ISet";
import { RecordedSet } from "../../models/recordedSetsModel";
import { BaseRepository } from "../BaseRepository";

export class RecordedSetsRepository extends BaseRepository<IRecordedSet> {
  constructor() {
    super(RecordedSet);
  }
}
