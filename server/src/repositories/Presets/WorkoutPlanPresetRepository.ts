import { IWorkoutPlanPreset, WorkoutPlanPreset } from "../../models/workoutPlanPresetModel";
import { BaseRepository } from "../BaseRepository";

export class WorkoutPlanPresetRepository extends BaseRepository<IWorkoutPlanPreset> {
  constructor() {
    super(WorkoutPlanPreset);
  }
}
