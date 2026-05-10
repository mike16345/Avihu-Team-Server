import { IWorkoutPlanPreset, WorkoutPlanPreset } from "../../models/workoutPlanPresetModel";
import { WorkoutPlanRepository } from "../workoutPlan/WorkoutPlanRepository";

export const WorkoutPlanPresetRepository = new WorkoutPlanRepository<IWorkoutPlanPreset>(
  WorkoutPlanPreset,
  {
    type: "trainer",
    field: "trainerId",
  }
);
