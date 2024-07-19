import { model, Schema } from "mongoose";
import Joi from "joi";
import { IWorkoutPlanPreset } from "../interfaces/IWorkoutPlan";
import { fullWorkoutPlanSchema, workoutPlanSchema, WorkoutPlanSchemaValidation } from "./workoutPlanModel";

export const workoutPlanPresetSchema = new Schema<IWorkoutPlanPreset>({
  workoutPlan: fullWorkoutPlanSchema,
});

export const WorkoutPlanPreset = model("workoutPresets", workoutPlanSchema);
