import { IMuscleGroupRecordedSets, IRecordedSet } from "../interfaces/ISet";
import { type RecordedSetsQueryParams } from "../types/QueryParams";
import SessionService from "./sessionService";
import { ISession, ISessionCreate } from "../models/sessionModel";
import { BaseService } from "./BaseService";
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
    exerciseKey: string,
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
        [plan]: { ...existingPlanData, [exerciseKey]: { setNumber: nextSetNumber } },
      },
    };

    return sessionDetails;
  }

  private async getCanonicalExerciseName(exerciseId: string): Promise<string | null> {
    if (!mongoose.Types.ObjectId.isValid(exerciseId)) {
      return null;
    }

    const db = mongoose.connection?.db;
    if (!db) {
      return null;
    }

    try {
      const exerciseDoc = await db.collection("exercises").findOne(
        { _id: new mongoose.Types.ObjectId(exerciseId) },
        {
          projection: { name: 1 },
        }
      );

      return exerciseDoc?.name ?? null;
    } catch (error) {
      return null;
    }
  }

  async addRecordedSets(
    userId: string,
    muscleGroup: string,
    exercise: string,
    exerciseId: string | null,
    sessionId: string | null,
    recordedSets: IRecordedSet[]
  ) {
    try {
      if (!recordedSets?.length) {
        throw new Error("No recorded sets provided");
      }
      const objectId = new mongoose.mongo.ObjectId(userId);
      const activeSession = sessionId ? await this.sessionService.getSessionById(sessionId) : null;
      const isNewSession = activeSession == null;

      const incomingExerciseKey = exercise;
      const canonicalExerciseName = exerciseId
        ? await this.getCanonicalExerciseName(exerciseId)
        : null;
      const canonicalKey = canonicalExerciseName ?? incomingExerciseKey;

      if (canonicalExerciseName && canonicalExerciseName !== incomingExerciseKey) {
        console.warn({
          service: "RecordedSetsService.addRecordedSets",
          userId,
          muscleGroup,
          exerciseId,
          receivedExerciseKey: incomingExerciseKey,
          canonicalExerciseName,
          sessionId,
          timestamp: new Date().toISOString(),
        });
      }

      const muscleGroupRecord = await this.repository.findOrCreate(objectId, muscleGroup);
      this.repository.initializeExerciseIfNecessary(muscleGroupRecord, canonicalKey);
      if (exerciseId && mongoose.Types.ObjectId.isValid(exerciseId)) {
        muscleGroupRecord.exerciseKeyToId = muscleGroupRecord.exerciseKeyToId ?? {};
        muscleGroupRecord.exerciseKeyToId[incomingExerciseKey] = exerciseId;
        muscleGroupRecord.exerciseKeyToId[canonicalKey] = exerciseId;
        muscleGroupRecord.markModified("exerciseKeyToId");
      }
      await muscleGroupRecord.save();

      const lastIndex = recordedSets.length - 1;
      const nextSetNumber = recordedSets[lastIndex]?.setNumber + 1;

      const normalizedSets: IRecordedSet[] = recordedSets.map(
        (s, i) =>
          new RecordedSet({
            ...s,
            setNumber: s.setNumber ?? nextSetNumber + i,
          })
      );

      const appendResult = await this.repository.appendRecordedSetsById(
        objectId,
        muscleGroup,
        canonicalKey,
        normalizedSets
      );

      const last = normalizedSets[normalizedSets.length - 1];
      const sessionDetails: ISessionCreate = this.buildSessionDetails(
        userId,
        canonicalKey,
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

  async addRecordedSet(
    userId: string,
    muscleGroup: string,
    exercise: string,
    exerciseId: string | null,
    sessionId: string,
    recordedSet: IRecordedSet
  ) {
    return this.addRecordedSets(userId, muscleGroup, exercise, exerciseId, sessionId, [
      recordedSet,
    ]);
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
      const result = await this.repository.findOne({
        query: { userId, muscleGroup },
        projection: { [`recordedSets.${exercise}`]: 1 } as Record<string, 1>,
      });

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
