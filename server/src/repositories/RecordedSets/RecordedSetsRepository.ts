import mongoose, { HydratedDocument } from "mongoose";
import { IMuscleGroupRecordedSets, IRecordedSet } from "../../interfaces/ISet";
import { MuscleGroupRecordedSets, RecordedSet } from "../../models/recordedSetsModel";
import { BaseRepository } from "../BaseRepository";

export class RecordedSetsRepository extends BaseRepository<IMuscleGroupRecordedSets> {
  constructor() {
    super(MuscleGroupRecordedSets, { type: "global" });
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

  async upsertRecordedSetsByDay(
    userId: mongoose.Types.ObjectId,
    muscleGroup: string,
    exercise: string,
    sets: IRecordedSet[]
  ) {
    if (!sets.length) return null;

    const path = `recordedSets.${exercise}`;

    for (const set of sets) {
      const setDate = new Date((set as any).date ?? Date.now());
      const dayStart = new Date(setDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(setDate);
      dayEnd.setHours(23, 59, 59, 999);

      const existing = await this.model.findOne({
        userId,
        muscleGroup,
        [path]: {
          $elemMatch: {
            setNumber: set.setNumber,
            date: { $gte: dayStart, $lte: dayEnd },
          },
        },
      });

      if (existing) {
        const $set: Record<string, unknown> = {
          [`${path}.$.weight`]: set.weight,
          [`${path}.$.repsDone`]: set.repsDone,
          [`${path}.$.date`]: setDate,
        };
        const $unset: Record<string, unknown> = {};
        if (set.rir === null || set.rir === undefined) {
          $unset[`${path}.$.rir`] = "";
        } else {
          $set[`${path}.$.rir`] = set.rir;
        }

        const update: Record<string, unknown> = { $set };
        if (Object.keys($unset).length > 0) update.$unset = $unset;

        await this.model.updateOne(
          {
            userId,
            muscleGroup,
            [path]: {
              $elemMatch: {
                setNumber: set.setNumber,
                date: { $gte: dayStart, $lte: dayEnd },
              },
            },
          },
          update
        );
      } else {
        await this.model.updateOne(
          { userId, muscleGroup },
          { $push: { [path]: set } }
        );
      }
    }

    return this.model.findOne({ userId, muscleGroup });
  }

  updateRecordedSetBySetId(setId: string, userId: string, exercise: string, set: IRecordedSet) {
    const query = {
      [`recordedSets.${exercise}._id`]: new mongoose.Types.ObjectId(setId),
      userId: new mongoose.Types.ObjectId(userId),
    };

    const $set: Record<string, unknown> = {
      [`recordedSets.${exercise}.$.repsDone`]: set.repsDone,
      [`recordedSets.${exercise}.$.weight`]: set.weight,
    };
    const $unset: Record<string, unknown> = {};

    const rirKey = `recordedSets.${exercise}.$.rir`;
    if (set.rir === null) {
      $unset[rirKey] = "";
    } else if (typeof set.rir === "number" && !Number.isNaN(set.rir)) {
      $set[rirKey] = set.rir;
    }

    const update: Record<string, unknown> = { $set };
    if (Object.keys($unset).length > 0) update.$unset = $unset;

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
