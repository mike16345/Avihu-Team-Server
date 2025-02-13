import { Schema, model } from "mongoose";
import { IDietItem, IDietPlan, IMeal } from "../interfaces/IDietPlan";
import Joi from "joi";

export const dietItemSchema = new Schema<IDietItem>({
  quantity: { type: Number, required: true },
  customItems: [{ type: Schema.Types.ObjectId, ref: "menuItems", required: false }],
  extraItems: { type: [String], required: false },
});

export const mealSchema = new Schema<IMeal>({
  totalProtein: { type: dietItemSchema, required: true },
  totalCarbs: { type: dietItemSchema, required: true },
});

export const dietPlanSchema = new Schema<IDietPlan>({
  userId: { type: String, required: true },
  meals: { type: [mealSchema], required: true },
  customInstructions: { type: [String], required: false },
  freeCalories: { type: Number, required: false },
  totalCalories: { type: Number, required: false },
  fatsPerDay: { type: Number, required: false },
  veggiesPerDay: { type: Number, required: false },
});

export const DietPlan = model<IDietPlan>("dietPlans", dietPlanSchema);

export const dietItemValidationSchema = Joi.object({
  quantity: Joi.number().required().message("כמות חייב להיות מספר"),
  customItems: Joi.array().items(Joi.string()).optional(),
  extraItems: Joi.array().items(Joi.string()).optional(),
});

export const mealValidationSchema = Joi.object({
  totalProtein: dietItemValidationSchema.required(),
  totalCarbs: dietItemValidationSchema.required(),
});

export const DietPlanSchemaValidation = Joi.object({
  userId: Joi.string().required(),
  meals: Joi.array()
    .items(mealValidationSchema)
    .min(1)
    .message("Diet Plan must contain at least one meal!")
    .required(),
  totalCalories: Joi.number().optional(),
  freeCalories: Joi.number().optional().min(0),
  fatsPerDay: Joi.number().optional().min(0),
  veggiesPerDay: Joi.number().optional().min(0),
  customInstructions: Joi.array().items(Joi.string()).allow("").optional(),
});
