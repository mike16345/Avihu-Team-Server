import { Schema, model } from "mongoose";
import { IDietItem, IDietPlan, IMeal } from "../interfaces/IDietPlan";
import Joi from "joi";

const dietItemSchema = new Schema<IDietItem>({
  quantity: { type: Number, required: true },
  unit: { type: String, enum: ["grams", "spoons"], required: true },
  customInstructions: [
    {
      item: { type: String, required: true },
      quantity: { type: Number, required: true },
    },
  ],
});

const mealSchema = new Schema<IMeal>({
  totalProtein: { type: dietItemSchema, required: true },
  totalCarbs: { type: dietItemSchema, required: true },
  totalFats: { type: dietItemSchema, required: false },
  totalVeggies: { type: dietItemSchema, required: false },
});

const dietPlanSchema = new Schema<IDietPlan>({
  userId: { type: String, required: true },
  meals: { type: [mealSchema], required: true },
  totalCalories: { type: Number, required: false },
});

export const DietPlan = model<IDietPlan>("dietPlans", dietPlanSchema);

const dietItemValidationSchema = Joi.object({
  quantity: Joi.number().required(),
  unit: Joi.string().valid("grams", "spoons").required(),
  customInstructions: Joi.array()
    .items(
      Joi.object({
        item: Joi.string().required(),
        quantity: Joi.number().required(),
      })
    )
    .optional(),
});

const mealValidationSchema = Joi.object({
  totalProtein: dietItemValidationSchema.required(),
  totalCarbs: dietItemValidationSchema.required(),
  totalFats: dietItemValidationSchema.optional(),
  totalVeggies: dietItemValidationSchema.optional(),
});

export const DietPlanSchemaValidation = Joi.object({
  userId: Joi.string().required(),
  meals: Joi.array().items(mealValidationSchema).required(),
  totalCalories: Joi.number().optional(),
});
