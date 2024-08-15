import { ObjectId } from "mongodb";
import { IMuscleGroupRecordedSets, IRecordedSet } from "../interfaces/ISet";
import { MuscleGroupRecordedSets, RecordedSet } from "../models/recordedSetsModel";
import { v4 as uuidv4 } from "uuid";
import { type RecordedSetsQueryParams } from "../types/QueryParams";
import SessionService from "./sessionService";
import { ISessionCreate } from "../models/sessionModel";

const getCurrentDate = () => {
  return new Date().toISOString().split("T")[0];
};

export class RecordedSetsService {
  static async addRecordedSet(
    userId: string,
    muscleGroup: string,
    exercise: string,
    sessionId: string,
    recordedSet: IRecordedSet
  ) {
    try {
      const objectId = new ObjectId(userId);
      const currentDate = getCurrentDate();
      const activeSession = await SessionService.getSessionById(sessionId);
      const isNewSession = activeSession == null;

      let lastSet: IRecordedSet | null = null;
      let nextSetNumber = 1;
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
      lastSet = muscleGroupRecord.recordedSets[exercise].slice(-1)[0];

      if (lastSet) {
        const lastSetDate = new Date(lastSet.date).toISOString().split("T")[0];

        if (lastSetDate === currentDate && !isNewSession) {
          nextSetNumber = lastSet.setNumber + 1;
        }
      }
      recordedSet.setNumber = nextSetNumber;
      muscleGroupRecord.recordedSets[exercise].push(new RecordedSet(recordedSet));
      muscleGroupRecord.markModified("recordedSets");
      const sessionDetails: ISessionCreate = {
        userId,
        type: "workout",
        data: {
          setNumber: nextSetNumber,
        },
      };

      let session;

      if (isNewSession) {
        session = await SessionService.startSession(sessionDetails);
      } else {
        session = await SessionService.updateSession(sessionId, sessionDetails);
      }

      const savedResult = await muscleGroupRecord.save();

      return {
        session: session,
        recordedSet: savedResult,
      };
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

  static async getUserRecordedMuscleGroupNames(query: Partial<RecordedSetsQueryParams>) {
    try {
      const muscleGroupRecords = await this.getRecordedSetsByUserId(query);

      if (typeof muscleGroupRecords == "string") {
        return muscleGroupRecords;
      }

      return (muscleGroupRecords as IMuscleGroupRecordedSets[]).map(
        (muscleGroup) => muscleGroup.muscleGroup
      );
    } catch (err: any) {
      throw err;
    }
  }
}
