import { ObjectId } from "mongodb";
import { IMuscleGroupRecordedSets, IRecordedSet } from "../interfaces/ISet";
import { MuscleGroupRecordedSets, RecordedSet } from "../models/recordedSetsModel";
import { type RecordedSetsQueryParams } from "../types/QueryParams";
import SessionService from "./sessionService";
import { ISessionCreate } from "../models/sessionModel";

const getCurrentDate = () => new Date().toISOString().split("T")[0];

const findOrCreateMuscleGroupRecord = async (userId: ObjectId, muscleGroup: string) => {
  let muscleGroupRecord = await MuscleGroupRecordedSets.findOne({ userId, muscleGroup });
  if (!muscleGroupRecord) {
    muscleGroupRecord = new MuscleGroupRecordedSets({
      userId,
      muscleGroup,
      recordedSets: {},
    });
  }
  return muscleGroupRecord;
};

const initializeExerciseIfNecessary = (
  muscleGroupRecord: IMuscleGroupRecordedSets,
  exercise: string
) => {
  if (!muscleGroupRecord.recordedSets[exercise]) {
    muscleGroupRecord.recordedSets[exercise] = [];
  }
};

const calculateNextSetNumber = (
  lastSet: IRecordedSet | null,
  isNewSession: boolean,
  currentDate: string
) => {
  if (!lastSet) return 1;
  const lastSetDate = new Date(lastSet.date).toISOString().split("T")[0];
  return lastSetDate === currentDate && !isNewSession ? lastSet.setNumber + 1 : 1;
};

const createOrUpdateSession = async (
  isNewSession: boolean,
  sessionId: string,
  sessionDetails: ISessionCreate
) => {
  if (isNewSession) {
    return SessionService.startSession(sessionDetails);
  }
  return SessionService.updateSession(sessionId, sessionDetails);
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

      const muscleGroupRecord = await findOrCreateMuscleGroupRecord(objectId, muscleGroup);
      initializeExerciseIfNecessary(muscleGroupRecord, exercise);

      const lastSet = muscleGroupRecord.recordedSets[exercise].slice(-1)[0] || null;
      const nextSetNumber = calculateNextSetNumber(lastSet, isNewSession, currentDate);

      recordedSet.setNumber = nextSetNumber;
      muscleGroupRecord.recordedSets[exercise].push(new RecordedSet(recordedSet));
      muscleGroupRecord.markModified("recordedSets");

      const sessionDetails: ISessionCreate = {
        userId,
        type: "workout",
        data: { setNumber: nextSetNumber },
      };

      const session = await createOrUpdateSession(isNewSession, sessionId, sessionDetails);
      const savedResult = await muscleGroupRecord.save();

      return {
        session,
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
