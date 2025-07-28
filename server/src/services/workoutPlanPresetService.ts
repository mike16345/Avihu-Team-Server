import { IWorkoutPlanPreset } from "../models/workoutPlanPresetModel";
import { WorkoutPlanPresetRepository } from "../repositories/Presets/WorkoutPlanPresetRepository";
import { BaseService } from "./BaseService";

const baseKey = "workout-plan-preset";

export class WorkoutPlanPresetService extends BaseService<
  IWorkoutPlanPreset,
  typeof WorkoutPlanPresetRepository
> {
  constructor() {
    super(WorkoutPlanPresetRepository, baseKey);
  }
}
