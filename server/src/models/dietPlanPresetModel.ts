import { Schema, model } from "mongoose";
import { IDietPlan, IDietPlanPreset } from "../interfaces/IDietPlan";
import { mealSchema, mealValidationSchema } from "./dietPlanModel";
import Joi from "joi";

export const dietPlanSchema = new Schema<IDietPlanPreset>({
  name: { type: String, required: true, min: 1, max: 25 },
  meals: { type: [mealSchema], required: true },
  totalCalories: { type: Number, required: false },
  freeCalories: { type: Number },
  customInstructions: { type: String },
});

export const DietPlanPresetsModel = model<IDietPlanPreset>("dietPlanPresets", dietPlanSchema);

export const DietPlanPresetSchemaValidation = Joi.object({
  name: Joi.string().min(1).max(25).required(),
  meals: Joi.array().items(mealValidationSchema).min(1).required(),
  totalCalories: Joi.number().optional(),
  freeCalories: Joi.number().optional(),
  customInstructions: Joi.string().optional(),
});
