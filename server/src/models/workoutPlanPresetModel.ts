import { model, Schema } from "mongoose";
import { IWorkoutPlanPreset } from "../interfaces/IWorkoutPlan";
import { fullWorkoutPlanSchema, workoutPlanSchema } from "./workoutPlanModel";

export const workoutPlanPresetSchema = new Schema<IWorkoutPlanPreset>({
  workoutPlan: fullWorkoutPlanSchema,
});

export const WorkoutPlanPreset = model("workoutPlanPresets", workoutPlanSchema);
