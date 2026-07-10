import { IStepsProgress, IStepsSyncPayload } from "../interfaces/IStepsProgress";
import { stepsProgressRepository } from "../repositories/StepsProgressRepository";
import { BaseService } from "./baseService";

const RESOURCE_NAME = "steps-progress";

const toDayKey = (date?: string | Date): string => {
  const value = date ? new Date(date) : new Date();
  if (Number.isNaN(value.getTime())) {
    throw { status: 400, message: "Invalid steps date" };
  }

  return value.toISOString().slice(0, 10);
};

export class StepsProgressService extends BaseService<
  IStepsProgress,
  typeof stepsProgressRepository
> {
  constructor() {
    super(stepsProgressRepository, RESOURCE_NAME);
  }

  syncDailyProgress = async (userId: string, payload: IStepsSyncPayload) => {
    const progress: IStepsProgress = {
      userId,
      date: toDayKey(payload.date),
      steps: Math.round(payload.steps),
      calories: payload.calories,
      distanceKm: payload.distanceKm,
      dailyGoal: payload.dailyGoal,
      source: payload.source ?? "unknown",
      syncedAt: new Date(),
    };

    const existing = await this.repository.findDailyProgress(userId, progress.date);
    if (existing && existing.steps > progress.steps) {
      progress.steps = existing.steps;
      progress.calories = existing.calories ?? progress.calories;
      progress.distanceKm = existing.distanceKm ?? progress.distanceKm;
      progress.source = existing.source ?? progress.source;
    }

    const synced = await this.repository.upsertDailyProgress(progress);
    this.cache.invalidateAll();

    return synced;
  };

  getUserRange = async (userId: string, from?: string, to?: string) => {
    const fromKey = from ? toDayKey(from) : undefined;
    const toKey = to ? toDayKey(to) : undefined;

    return this.repository.findByUserAndDateRange(userId, fromKey, toKey);
  };
}
