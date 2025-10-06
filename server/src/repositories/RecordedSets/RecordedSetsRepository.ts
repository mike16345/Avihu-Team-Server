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

  appendRecordedSets(
    muscleGroupRecord: HydratedDocument<IMuscleGroupRecordedSets>,
    exercise: string,
    sets: IRecordedSet[]
  ) {
    if (!muscleGroupRecord.recordedSets[exercise]) {
      muscleGroupRecord.recordedSets[exercise] = [];
    }

    muscleGroupRecord.recordedSets[exercise].push(...sets);
  }

  appendRecordedSetsById(
    userId: mongoose.Types.ObjectId,
    muscleGroup: string,
    exercise: string,
    sets: IRecordedSet[]
  ) {
    return this.model.updateOne(
      { userId, muscleGroup },
      { $push: { [`recordedSets.${exercise}`]: { $each: sets } } }
    );
  }

  updateRecordedSetBySetId(setId: string, userId: string, exercise: string, set: IRecordedSet) {
    const query = {
      [`recordedSets.${exercise}._id`]: new mongoose.Types.ObjectId(setId),
      userId: new mongoose.Types.ObjectId(userId),
    };
    const update = {
      $set: {
        [`recordedSets.${exercise}.$.repsDone`]: set.repsDone,
        [`recordedSets.${exercise}.$.weight`]: set.weight,
      },
    };

    return this.model.updateOne(query, update);
  }

  deleteRecordedSetById(userId: string, exercise: string, setId: string) {
    const query = {
      userId: new mongoose.Types.ObjectId(userId),
      [`recordedSets.${exercise}._id`]: new mongoose.Types.ObjectId(setId),
    };

    return this.model.updateOne(query, {
      $pull: {
        [`recordedSets.${exercise}`]: { _id: new mongoose.Types.ObjectId(setId) },
      },
    });
  }
}
