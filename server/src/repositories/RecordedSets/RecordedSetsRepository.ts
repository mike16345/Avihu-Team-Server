import mongoose, { HydratedDocument } from "mongoose";
import { IMuscleGroupRecordedSets, IRecordedSet } from "../../interfaces/ISet";
import { MuscleGroupRecordedSets, RecordedSet } from "../../models/recordedSetsModel";
import { BaseRepository } from "../BaseRepository";

export class RecordedSetsRepository extends BaseRepository<IMuscleGroupRecordedSets> {
  constructor() {
    super(MuscleGroupRecordedSets);
  }

  async findOrCreate(userId: mongoose.Types.ObjectId, muscleGroup: string) {
    let record =
      (await this.model.findOne({ userId, muscleGroup })) ||
      new this.model({ userId, muscleGroup, recordedSets: {} });

    return record;
  }

  initializeExerciseIfNecessary = (
    muscleGroupRecord: IMuscleGroupRecordedSets,
    exercise: string
  ) => {
    if (!muscleGroupRecord.recordedSets[exercise]) {
      muscleGroupRecord.recordedSets[exercise] = [];
    }
  };

  appendRecordedSet(
    record: HydratedDocument<IMuscleGroupRecordedSets>,
    exercise: string,
    set: IRecordedSet
  ) {
    record.recordedSets[exercise].push(new RecordedSet(set));
    record.markModified("recordedSets");
  }
}
