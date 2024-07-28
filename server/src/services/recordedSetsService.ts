import { ObjectId } from "mongodb";
import { IMuscleGroupRecordedSets, IRecordedSet } from "../interfaces/ISet";
import { MuscleGroupRecordedSets, RecordedSet } from "../models/recordedSetsModel";
import { v4 as uuidv4 } from "uuid";
import { type RecordedSetsQueryParams } from "../types/QueryParams";

const getCurrentDate = () => {
  const date = new Date();
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date
    .getDate()
    .toString()
    .padStart(2, "0")}`;
};

export class RecordedSetsService {
  static async addRecordedSet(
    userId: string,
    muscleGroup: string,
    exercise: string,
    recordedSet: IRecordedSet
  ) {
    // TODO: Fix up the code. And figure out the whole session ID thing.
    try {
      const objectId = new ObjectId(userId);
      const currentDate = getCurrentDate();

      let muscleGroupRecord = await MuscleGroupRecordedSets.findOne({
        userId: objectId,
        muscleGroup,
      });

      if (!muscleGroupRecord) {
        muscleGroupRecord = new MuscleGroupRecordedSets({
          userId: objectId,
          muscleGroup,
          recordedSets: {},
        });
      }

      if (!muscleGroupRecord.recordedSets[exercise]) {
        muscleGroupRecord.recordedSets[exercise] = [];
      }

      const lastSet = muscleGroupRecord.recordedSets[exercise].slice(-1)[0];
      let nextSetNumber = 1;
      let sessionId = lastSet?.sessionId;

      console.log("last set", lastSet);

      if (lastSet) {
        const lastSetDate = new Date(lastSet.date);
        const lastSetDateString = `${lastSetDate.getFullYear()}-${(lastSetDate.getMonth() + 1)
          .toString()
          .padStart(2, "0")}-${lastSetDate.getDate().toString().padStart(2, "0")}`;

        // nextSetNumber = lastSet.setNumber + 1;
        if (lastSetDateString === currentDate && sessionId === recordedSet?.sessionId) {
          nextSetNumber = lastSet.setNumber + 1;
        }
      }

      recordedSet.setNumber = nextSetNumber;

      const newRecordedSet = new RecordedSet({
        ...recordedSet,
        setNumber: nextSetNumber,
        sessionId: sessionId || uuidv4(),
      });
      muscleGroupRecord.recordedSets[exercise].push(newRecordedSet);
      muscleGroupRecord.markModified("recordedSets");

      const res = await muscleGroupRecord.save();

      return res;
    } catch (e: any) {
      throw e;
    }
  }

  static async getRecordedSetsByUserId({
    userId,
    muscleGroup,
    exercise,
  }: Partial<RecordedSetsQueryParams>) {
    try {
      const query: any = { userId };

      if (muscleGroup) {
        query.muscleGroup = muscleGroup;
      }

      const muscleGroupRecords = await MuscleGroupRecordedSets.find(query).exec();

      if (muscleGroupRecords.length === 0) {
        return "No records found for user!";
      }

      if (!exercise) return muscleGroupRecords;

      return (
        muscleGroupRecords.map((record) => record.recordedSets[exercise])[0] ||
        "No exercises found for: " + exercise
      );
    } catch (err: any) {
      throw err;
    }
  }

  static async getUserRecordedExerciseNamesByMuscleGroup(query: Partial<RecordedSetsQueryParams>) {
    try {
      const muscleGroupRecords = await this.getRecordedSetsByUserId(query);

      if (typeof muscleGroupRecords == "string") {
        return muscleGroupRecords;
      }

      return Object.keys((muscleGroupRecords[0] as IMuscleGroupRecordedSets).recordedSets);
    } catch (err: any) {
      throw err;
    }
  }
}
