import { IMuscleGroupRecordedSets, IRecordedSet } from "../interfaces/ISet";
import { type RecordedSetsQueryParams } from "../types/QueryParams";
import SessionService from "./sessionService";
import { ISession, ISessionCreate } from "../models/sessionModel";
import { BaseService } from "./baseService";
import { RecordedSetsRepository } from "../repositories/RecordedSets/RecordedSetsRepository";
import { stableStringify } from "../utils/utils";
import mongoose from "mongoose";
import { FIND_ONE_FAILURE } from "../constants/repository";
import { RecordedSet } from "../models/recordedSetsModel";

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
    const existingData = (activeSession?.data ?? {}) as Record<string, any>;
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

  async addRecordedSets(
    userId: string,
    muscleGroup: string,
    exercise: string,
    sessionId: string | null,
    recordedSets: IRecordedSet[],
    exerciseId?: string
  ) {
    try {
      if (!recordedSets?.length) {
        throw new Error("No recorded sets provided");
      }

      const exerciseObjectId =
        exerciseId && mongoose.isValidObjectId(exerciseId)
          ? new mongoose.mongo.ObjectId(exerciseId)
          : null;
      const objectId = new mongoose.mongo.ObjectId(userId);
      const activeSession = sessionId ? await this.sessionService.getSessionById(sessionId) : null;
      const isNewSession = activeSession == null;

      const muscleGroupRecord = await this.repository.findOrCreate(objectId, muscleGroup);
      this.repository.initializeExerciseIfNecessary(muscleGroupRecord, exercise);
      await muscleGroupRecord.save();

      const lastIndex = recordedSets.length - 1;
      const nextSetNumber = recordedSets[lastIndex]?.setNumber + 1;

      const normalizedSets: IRecordedSet[] = recordedSets.map(
        (s, i) =>
          new RecordedSet({
            ...s,
            setNumber: s.setNumber ?? nextSetNumber + i,
            ...(exerciseObjectId ? { exerciseId: exerciseObjectId } : {}),
          })
      );

      await this.repository.appendRecordedSetsById(objectId, muscleGroup, exercise, normalizedSets);

      const last = normalizedSets[normalizedSets.length - 1];
      const sessionDetails: ISessionCreate = this.buildSessionDetails(
        userId,
        exercise,
        nextSetNumber,
        last,
        activeSession
      );

      const session = isNewSession
        ? await this.sessionService.create(sessionDetails as ISession)
        : await this.sessionService.updateById(sessionId!, {
            ...sessionDetails,
            updatedAt: new Date(),
          });

      this.cache.invalidateAllContaining(userId);

      return {
        session,
      };
    } catch (e: any) {
      throw e;
    }
  }

  async updateRecordedSetById(setId: string, userId: string, exercise: string, set: IRecordedSet) {
    return this.repository.updateRecordedSetBySetId(setId, userId, exercise, set);
  }

  async deleteRecordedSetById(setId: string, userId: string, exercise: string) {
    return this.repository.deleteRecordedSetById(userId, exercise, setId);
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

  async getUserRecordedSetsByExercise(
    query: RecordedSetsQueryParams
  ): Promise<IRecordedSet[] | null> {
    const cacheKey = stableStringify(query);
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;
    const { userId, muscleGroup, exercise } = query;

    try {
      const result = (await this.repository.findOne({
        query: { userId, muscleGroup },
        projection: { [`recordedSets.${exercise}`]: 1 },
      })) as unknown as IMuscleGroupRecordedSets | null;

      const sets = result?.recordedSets?.[exercise];
      if (!sets) return [];
      this.cache.set(cacheKey, sets);

      return sets;
    } catch (err: any) {
      if (err.message === FIND_ONE_FAILURE) return [];
      throw err;
    }
  }
}
