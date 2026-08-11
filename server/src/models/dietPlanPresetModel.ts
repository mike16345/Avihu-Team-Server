import { Schema, model } from "mongoose";
import { IDietPlanPreset } from "../interfaces/IDietPlan";
import { mealSchema, mealValidationSchema } from "./dietPlanModel";
import Joi from "joi";
import { IModel } from "../interfaces/IModel";

export const DIET_PLAN_PRESETS_COLLECTION = "dietplanpresets";

/**
 * Optional trainer-tagged meta — used by the admin panel to filter
 * presets (goal / calorie bucket / dietary restrictions / who built it).
 * All optional, backwards-compatible with older docs.
 */
export const dietMetaFields = {
  goal: { type: String, enum: ["cutting", "mass"] },
  calories: { type: Number, min: 0, max: 10000 },
  proteinServings: { type: Number, min: 0, max: 100 },
  carbServings: { type: Number, min: 0, max: 100 },
  fatServings: { type: Number, min: 0, max: 100 },
  dietaryRestrictions: {
    type: [String],
    enum: ["lactose-free", "vegetarian", "vegan", "no-fish", "no-meat", "gluten-free"],
    default: undefined,
  },
  builtByTrainerId: { type: String },
};

export const dietPlanSchema = new Schema<IDietPlanPreset & IModel>({
  name: { type: String, required: true, unique: true, min: 1, max: 100 },
  trainerId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "trainers",
  },
  meals: { type: [mealSchema], required: true },
  totalCalories: { type: Number, required: false },
  freeCalories: { type: Number, required: false },
  fatsPerDay: { type: Number, required: false },
  veggiesPerDay: { type: Number, required: false },
  customInstructions: { type: [String], required: false },
  supplements: { type: [String], required: false, default: [] },
  ...dietMetaFields,
});

export const DietPlanPresetsModel = model<IDietPlanPreset & IModel>(
  "dietPlanPresets",
  dietPlanSchema,
  DIET_PLAN_PRESETS_COLLECTION
);

/** Kept in sync with dietMetaFields above. */
export const dietMetaValidationFields = {
  goal: Joi.string().valid("cutting", "mass").optional(),
  calories: Joi.number().min(0).max(10000).optional(),
  proteinServings: Joi.number().min(0).max(100).optional(),
  carbServings: Joi.number().min(0).max(100).optional(),
  fatServings: Joi.number().min(0).max(100).optional(),
  dietaryRestrictions: Joi.array()
    .items(Joi.string().valid("lactose-free", "vegetarian", "vegan", "no-fish", "no-meat", "gluten-free"))
    .optional(),
  builtByTrainerId: Joi.string().optional(),
};

export const DietPlanPresetSchemaValidation = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  meals: Joi.array().items(mealValidationSchema).min(1).required(),
  totalCalories: Joi.number().optional(),
  fatsPerDay: Joi.number().min(0).optional(),
  veggiesPerDay: Joi.number().min(0).optional(),
  supplements: Joi.array().min(0).optional(),
  customInstructions: Joi.array().items(Joi.string()).allow("").optional(),
  freeCalories: Joi.number().optional().min(0),
  ...dietMetaValidationFields,
});
