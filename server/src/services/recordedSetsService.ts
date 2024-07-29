import { ObjectId } from "mongodb";
import { IRecordedSet } from "../interfaces/ISet";
import { MuscleGroupRecordedSets, RecordedSet } from "../models/recordedSetsModel";
import { v4 as uuidv4 } from "uuid";

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

      const currentDate = getCurrentDate();
      const lastSet = muscleGroupRecord.recordedSets[exercise].slice(-1)[0];
      let nextSetNumber = 1;
      let sessionId = lastSet.sessionId;

      if (lastSet) {
        const lastSetDate = new Date(lastSet.date);
        const lastSetDateString = `${lastSetDate.getFullYear()}-${(lastSetDate.getMonth() + 1)
          .toString()
          .padStart(2, "0")}-${lastSetDate.getDate().toString().padStart(2, "0")}`;

        // nextSetNumber = lastSet.setNumber + 1;
        if (lastSetDateString === currentDate && sessionId === recordedSet.sessionId) {
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

  static async getRecordedSetsByUserId(userId: string) {
    try {
      const objectId = new ObjectId(userId);
      const muscleGroupRecords = await MuscleGroupRecordedSets.find({ userId: objectId });

      if (muscleGroupRecords.length === 0) {
        return "No records found for user!";
      }

      return muscleGroupRecords;
    } catch (err: any) {
      throw err;
    }
  }

  static async getRecordedSetsByUserAndMuscleGroup(userId: string, muscleGroup: string) {
    try {
      const objectId = new ObjectId(userId);
      const muscleGroupRecord = await MuscleGroupRecordedSets.findOne({
        userId: objectId,
        muscleGroup,
      });

      if (!muscleGroupRecord) {
        return "No records found for user or muscle group!";
      }

      return muscleGroupRecord.recordedSets[muscleGroup];
    } catch (err: any) {
      throw err;
    }
  }
}
