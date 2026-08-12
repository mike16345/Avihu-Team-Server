import { Schema, model } from "mongoose";
import { IDietItem, IDietPlan, IMeal } from "../interfaces/IDietPlan";
import Joi from "joi";

export const DIET_PLANS_COLLECTION = "dietplans";

export const dietItemSchema = new Schema<IDietItem>({
  quantity: { type: Number, required: true },
  customItems: [{ type: Schema.Types.ObjectId, ref: "menuItems", required: false }],
  extraItems: { type: [String], required: false },
});

export const mealSchema = new Schema<IMeal>({
  totalProtein: { type: dietItemSchema, required: true },
  totalCarbs: { type: dietItemSchema, required: true },
  totalFats: { type: dietItemSchema },
  totalVeggies: { type: dietItemSchema },
});

export const dietPlanSchema = new Schema<IDietPlan>({
  version: { type: Number, enum: [1], required: false },
  userId: { type: String, required: true },
  meals: { type: [mealSchema], required: true },
  supplements: { type: [String], required: false, default: [] },
  customInstructions: { type: [String], required: false, default: [] },
  freeCalories: { type: Number, required: false },
  totalCalories: { type: Number, required: false },
  fatsPerDay: { type: Number, required: false },
  veggiesPerDay: { type: Number, required: false },
});

export const DietPlan = model<IDietPlan>("dietPlans", dietPlanSchema, DIET_PLANS_COLLECTION);

export const dietItemValidationSchema = Joi.object({
  quantity: Joi.number().required(),
  customItems: Joi.array().items(Joi.string()).optional(),
  extraItems: Joi.array().items(Joi.string()).optional(),
});

export const mealValidationSchema = Joi.object({
  totalProtein: dietItemValidationSchema.required(),
  totalCarbs: dietItemValidationSchema.required(),
  totalVeggies: dietItemValidationSchema,
  totalFats: dietItemValidationSchema,
});

export const DietPlanSchemaValidation = Joi.object({
  version: Joi.number().valid(1).optional(),
  userId: Joi.string().required(),
  meals: Joi.array()
    .items(mealValidationSchema)
    .min(1)
    .message("Diet Plan must contain at least one meal!")
    .required(),
  totalCalories: Joi.number().optional(),
  freeCalories: Joi.number().optional().min(0),
  fatsPerDay: Joi.number().optional().min(0),
  supplements: Joi.array().min(0).optional(),
  veggiesPerDay: Joi.number().optional().min(0),
  customInstructions: Joi.array().items(Joi.string()).allow("").optional(),
});

export const DietPlanUpdateSchemaValidation = DietPlanSchemaValidation.fork(["userId"], (schema) =>
  schema.optional()
);
