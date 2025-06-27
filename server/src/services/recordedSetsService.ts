import { IMuscleGroupRecordedSets, IRecordedSet } from "../interfaces/ISet";
import { RecordedSet } from "../models/recordedSetsModel";
import { type RecordedSetsQueryParams } from "../types/QueryParams";
import SessionService from "./sessionService";
import { ISession, ISessionCreate } from "../models/sessionModel";
import { BaseService } from "./BaseService";
import { RecordedSetsRepository } from "../repositories/RecordedSets/RecordedSetsRepository";
import { stableStringify } from "../utils/utils";
import mongoose from "mongoose";

const calculateNextSetNumber = (activeSession: any, planName: string, exercise: string) => {
  if (!activeSession) return 1;

  return activeSession.data?.[planName]?.[exercise]?.setNumber + 1 || 1;
};

export class RecordedSetsService extends BaseService<
  IMuscleGroupRecordedSets,
  RecordedSetsRepository
> {
  sessionService: SessionService;

  constructor() {
    super(new RecordedSetsRepository(), "recorded-sets");
    this.sessionService = new SessionService();
  }

  private buildSessionDetails(
    userId: string,
    exercise: string,
    nextSetNumber: number,
    recordedSet: IRecordedSet,
    activeSession: ISession | null = null
  ): ISessionCreate {
    const plan = recordedSet.plan;
    const existingData = activeSession?.data ?? {};
    const existingPlanData = existingData[plan] ?? {};
    const sessionDetails: ISessionCreate = {
      userId,
      type: "workout",
      data: {
        ...activeSession?.data,
        [plan]: { ...existingPlanData, [exercise]: { setNumber: nextSetNumber } },
      },
    };

    return sessionDetails;
  }

  async addRecordedSet(
    userId: string,
    muscleGroup: string,
    exercise: string,
    sessionId: string,
    recordedSet: IRecordedSet
  ) {
    try {
      const objectId = new mongoose.mongo.ObjectId(userId);
      const activeSession = sessionId ? await this.sessionService.getSessionById(sessionId) : null;
      const isNewSession = activeSession == null;
      const muscleGroupRecord = await this.repository.findOrCreate(objectId, muscleGroup);

      this.repository.initializeExerciseIfNecessary(muscleGroupRecord, exercise);
      const nextSetNumber = calculateNextSetNumber(activeSession, recordedSet.plan, exercise);
      recordedSet.setNumber = nextSetNumber;

      this.repository.appendRecordedSet(muscleGroupRecord, exercise, new RecordedSet(recordedSet));
      const savedResult = await muscleGroupRecord.save();

      const sessionDetails: ISessionCreate = this.buildSessionDetails(
        userId,
        exercise,
        nextSetNumber,
        recordedSet,
        activeSession
      );
      const session = isNewSession
        ? await this.sessionService.create(sessionDetails as ISession)
        : this.sessionService.updateById(sessionId, sessionDetails);

      this.cache.invalidateAllContaining(userId);

      return {
        session,
        recordedSet: savedResult,
      };
    } catch (e: any) {
      throw e;
    }
  }

  async getRecordedSetsByUserId(query: Partial<RecordedSetsQueryParams>) {
    try {
      const { exercise } = query;
      const cacheKey = stableStringify(query);
      const muscleGroupRecords = await this.repository.find({ query });

      this.cache.set(cacheKey, muscleGroupRecords);

      if (!query.exercise) return muscleGroupRecords;
      const result = exercise
        ? muscleGroupRecords.map((record) => record.recordedSets[exercise])[0] ||
          `No exercises found for: ${exercise}`
        : muscleGroupRecords;

      this.cache.set(cacheKey, result);

      return result;
    } catch (err: any) {
      throw err;
    }
  }
}
