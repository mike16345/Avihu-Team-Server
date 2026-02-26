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

  async deleteRecordedSetById(userId: string, exercise: string, setId: string) {
    const query = {
      userId: new mongoose.Types.ObjectId(userId),
      [`recordedSets.${exercise}._id`]: new mongoose.Types.ObjectId(setId),
    };

    const setObjectId = new mongoose.Types.ObjectId(setId);
    const recordedSetsPath = `recordedSets.${exercise}`;

    const updatedRecord = await this.model.findOneAndUpdate(
      query,
      [
        {
          $set: {
            [recordedSetsPath]: {
              $filter: {
                input: `$${recordedSetsPath}`,
                as: "set",
                cond: { $ne: ["$$set._id", setObjectId] },
              },
            },
          },
        },
        {
          $set: {
            _recordedSetsSize: { $size: `$${recordedSetsPath}` },
          },
        },
        {
          $set: {
            [recordedSetsPath]: {
              $cond: [{ $eq: ["$_recordedSetsSize", 0] }, "$$REMOVE", `$${recordedSetsPath}`],
            },
          },
        },
        { $unset: "_recordedSetsSize" },
      ],
      { new: true }
    );

    if (!updatedRecord) return null;

    const recordedSetsKeysCount = Object.keys(updatedRecord.recordedSets ?? {}).length;
    if (recordedSetsKeysCount === 0) {
      await this.model.deleteOne({ _id: updatedRecord._id });
    }

    return updatedRecord;
  }
}
