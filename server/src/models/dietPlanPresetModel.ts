import { Schema, model } from "mongoose";
import { IDietPlanPreset } from "../interfaces/IDietPlan";
import { mealSchema, mealValidationSchema } from "./dietPlanModel";
import Joi from "joi";

export const dietPlanSchema = new Schema<IDietPlanPreset>({
  name: { type: String, required: true, unique: true, min: 1, max: 100 },
  meals: { type: [mealSchema], required: true },
  totalCalories: { type: Number, required: false },
  freeCalories: { type: Number, required: false },
  fatsPerDay: { type: Number, required: false },
  veggiesPerDay: { type: Number, required: false },
  customInstructions: { type: [String], required: false },
});

export const DietPlanPresetsModel = model<IDietPlanPreset>("dietPlanPresets", dietPlanSchema);

export const DietPlanPresetSchemaValidation = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  meals: Joi.array().items(mealValidationSchema).min(1).required(),
  totalCalories: Joi.number().optional(),
  fatsPerDay: Joi.number().min(0).optional(),
  veggiesPerDay: Joi.number().min(0).optional(),
  supplements: Joi.array().min(0).optional(),
  customInstructions: Joi.array().items(Joi.string()).allow("").optional(),
  freeCalories: Joi.number().optional().min(0),
});
