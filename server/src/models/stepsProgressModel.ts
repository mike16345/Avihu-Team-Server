import { Schema, model } from "mongoose";
import Joi from "joi";
import { IStepsProgress } from "../interfaces/IStepsProgress";

export const stepsProgressSchema = new Schema<IStepsProgress>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
    },
    steps: {
      type: Number,
      required: true,
      min: 0,
    },
    calories: {
      type: Number,
      min: 0,
    },
    distanceKm: {
      type: Number,
      min: 0,
    },
    dailyGoal: {
      type: Number,
      min: 1,
    },
    source: {
      type: String,
      enum: ["healthkit", "health_connect", "manual", "unknown"],
      default: "unknown",
    },
    syncedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true }
);

stepsProgressSchema.index({ userId: 1, date: 1 }, { unique: true, name: "userId_date_unique" });

export const stepsSyncValidationSchema = Joi.object({
  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  steps: Joi.number().integer().min(0).required(),
  calories: Joi.number().min(0).optional(),
  distanceKm: Joi.number().min(0).optional(),
  dailyGoal: Joi.number().integer().min(1).optional(),
  source: Joi.string().valid("healthkit", "health_connect", "manual", "unknown").optional(),
});

export const StepsProgress = model<IStepsProgress>("stepsProgress", stepsProgressSchema);
