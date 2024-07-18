import { Model, Schema } from "mongoose";
import Joi from "joi";
import { IWorkoutPlanPreset } from "../interfaces/IWorkoutPlan";
import { fullWorkoutPlanSchema } from "./workoutPlanModel";

export const workoutPlanPresetSchema = new Schema<IWorkoutPlanPreset>({
  name: { type: String, required: true, unique: true },
  workoutPlan: fullWorkoutPlanSchema,
});
