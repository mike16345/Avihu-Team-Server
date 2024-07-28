import { IWorkoutPlanPreset } from "../../src/interfaces/IWorkoutPlan";
import { ValidDetailedWorkoutPlan } from "./workoutPlanFixtures";

export const validWorkoutPlanPreset: IWorkoutPlanPreset = {
  name: "Valid Preset",
  workoutPlans: [ValidDetailedWorkoutPlan],
};

export const invalidWorkoutPlanPresetEmptyPlans: Partial<IWorkoutPlanPreset> = {
  name: "Invalid Preset",
  workoutPlans: [],
};

export const invalidWorkoutPlanPresetNoName: Partial<IWorkoutPlanPreset> = {
  workoutPlans: [ValidDetailedWorkoutPlan],
};
