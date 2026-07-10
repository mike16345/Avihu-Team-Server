export type StepsSyncSource = "healthkit" | "health_connect" | "manual" | "unknown";

export interface IStepsProgress {
  userId: string;
  date: string;
  steps: number;
  calories?: number;
  distanceKm?: number;
  dailyGoal?: number;
  source?: StepsSyncSource;
  syncedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IStepsSyncPayload {
  date?: string;
  steps: number;
  calories?: number;
  distanceKm?: number;
  dailyGoal?: number;
  source?: StepsSyncSource;
}
