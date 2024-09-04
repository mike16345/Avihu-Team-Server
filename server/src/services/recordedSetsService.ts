import { IMuscleGroupRecordedSets, IRecordedSet } from "../interfaces/ISet";
import { MuscleGroupRecordedSets, RecordedSet } from "../models/recordedSetsModel";
import { type RecordedSetsQueryParams } from "../types/QueryParams";
import SessionService from "./sessionService";
import { ISessionCreate } from "../models/sessionModel";
import mongoose from "mongoose";
import { Cache } from "../utils/cache";

const cachedRecordedSets = new Cache<any>();

const findOrCreateMuscleGroupRecord = async (userId: any, muscleGroup: string) => {
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

const calculateNextSetNumber = (activeSession: any, planName: string, exercise: string) => {
  if (!activeSession) return 1;

  return (
    (activeSession.data[planName] && activeSession.data[planName][exercise]?.setNumber) + 1 || 1
  );
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
      const objectId = new mongoose.mongo.ObjectId(userId);
      console.log("session ", sessionId);
      const activeSession = sessionId ? await SessionService.getSessionById(sessionId) : null;
      const isNewSession = activeSession == null;

      const muscleGroupRecord = await findOrCreateMuscleGroupRecord(objectId, muscleGroup);
      initializeExerciseIfNecessary(muscleGroupRecord, exercise);

      const nextSetNumber = calculateNextSetNumber(activeSession, recordedSet.plan, exercise);
      console.log("muscle group : ", muscleGroup);
      console.log("exercise : ", exercise);
      console.log("next set number for exercise " + nextSetNumber);

      recordedSet.setNumber = nextSetNumber;
      muscleGroupRecord.recordedSets[exercise].push(new RecordedSet(recordedSet));
      muscleGroupRecord.markModified("recordedSets");

      const plan = recordedSet.plan;
      const prevExerciseData = activeSession?.data[plan] || {};
      console.log("exercise data", prevExerciseData);
      const sessionDetails: ISessionCreate = {
        userId,
        type: "workout",
        data: {
          ...activeSession?.data,
          [plan]: { ...prevExerciseData, [exercise]: { setNumber: nextSetNumber } },
        },
      };
      const session = await createOrUpdateSession(isNewSession, sessionId, sessionDetails);
      const savedResult = await muscleGroupRecord.save();

      cachedRecordedSets.invalidate(`user:${userId}:muscleGroup:${muscleGroup}`);
      cachedRecordedSets.invalidate(`user:${userId}:exercise:${exercise}`);

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
    const cacheKey = `user:${userId}:${muscleGroup ? `muscleGroup:${muscleGroup}` : ""}${
      exercise ? `:exercise:${exercise}` : ""
    }`;
    const cached = cachedRecordedSets.get(cacheKey);
    console.log("cache key: " + cacheKey);
    if (cached) {
      console.log("returning cached data", cached);
      return cached;
    }

    try {
      const query: any = { userId };

      if (muscleGroup) {
        query.muscleGroup = muscleGroup;
      }

      const muscleGroupRecords = await MuscleGroupRecordedSets.find(query).exec();

      if (muscleGroupRecords.length === 0) {
        return "No records found for user!";
      }

      cachedRecordedSets.set(cacheKey, muscleGroupRecords);
      if (!exercise) return muscleGroupRecords;

      const result = exercise
        ? muscleGroupRecords.map((record) => record.recordedSets[exercise])[0] ||
          `No exercises found for: ${exercise}`
        : muscleGroupRecords;

      cachedRecordedSets.set(cacheKey, result);

      return result;
    } catch (err: any) {
      throw err;
    }
  }

  static async getUserRecordedExerciseNamesByMuscleGroup(query: Partial<RecordedSetsQueryParams>) {
    const cacheKey = `user:${query.userId}:muscleGroup:${query.muscleGroup}:exerciseNames`;
    const cached = cachedRecordedSets.get(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const muscleGroupRecords = await this.getRecordedSetsByUserId(query);

      if (typeof muscleGroupRecords == "string") {
        return muscleGroupRecords;
      }

      const result = Object.keys((muscleGroupRecords[0] as IMuscleGroupRecordedSets).recordedSets);
      cachedRecordedSets.set(cacheKey, result);

      return result;
    } catch (err: any) {
      throw err;
    }
  }

  static async getUserRecordedMuscleGroupNames(query: Partial<RecordedSetsQueryParams>) {
    const cacheKey = `user:${query.userId}:muscleGroupNames`;
    const cached = cachedRecordedSets.get(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const muscleGroupRecords = await this.getRecordedSetsByUserId(query);

      if (typeof muscleGroupRecords == "string") {
        return muscleGroupRecords;
      }

      const result = (muscleGroupRecords as IMuscleGroupRecordedSets[]).map(
        (muscleGroup) => muscleGroup.muscleGroup
      );
      cachedRecordedSets.set(cacheKey, result);

      return result;
    } catch (err: any) {
      throw err;
    }
  }
}
