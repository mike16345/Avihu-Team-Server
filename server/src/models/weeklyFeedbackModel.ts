import { Schema, model } from "mongoose";
import { IWeeklyFeedback } from "../interfaces/IWeeklyFeedback";
import Joi from "joi";

const workoutSchema = new Schema(
  {
    planId: { type: String, required: true },
    doneSmart: { type: Boolean, default: false },
    doneManual: { type: Boolean, default: false },
  },
  { _id: false }
);

const weighInSubSchema = new Schema(
  {
    date: { type: Date, required: true },
    weight: { type: Number, min: 1, max: 600 },
  },
  { _id: false }
);

const nutritionSubSchema = new Schema(
  {
    daysCompleted: { type: [String], default: [] },
    dayNotes: { type: Map, of: String, default: {} },
  },
  { _id: false }
);

const weeklyFeedbackSchema = new Schema<IWeeklyFeedback>(
  {
    userId: { type: String, required: true, index: true },
    weekStart: { type: Date, required: true },
    weekEnd: { type: Date, required: true },
    workouts: { type: [workoutSchema], default: [] },
    nutrition: { type: nutritionSubSchema, default: () => ({ daysCompleted: [], dayNotes: {} }) },
    weighIns: { type: [weighInSubSchema], default: [] },
    sleepHours: { type: Number, min: 0, max: 24, default: null },
    cardioMinutes: { type: Number, min: 0, max: 1000, default: null },
    cardioMinutesGoal: { type: Number, min: 0, max: 1000, default: null },
    steps: { type: Number, min: 0, default: null },
    feedbackText: { type: String, default: "" },
    finalized: { type: Boolean, default: false },
    submittedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "weeklyFeedback" }
);

weeklyFeedbackSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

export const WeeklyFeedback = model<IWeeklyFeedback>("weeklyFeedback", weeklyFeedbackSchema);

const WorkoutValidation = Joi.object({
  planId: Joi.string().required(),
  doneSmart: Joi.boolean().default(false),
  doneManual: Joi.boolean().default(false),
});

const WeighInValidation = Joi.object({
  date: Joi.date().required(),
  weight: Joi.number().min(1).max(600).required(),
});

const NutritionValidation = Joi.object({
  daysCompleted: Joi.array().items(Joi.string()).default([]),
  dayNotes: Joi.object().pattern(Joi.string(), Joi.string()).default({}),
});

export const WeeklyFeedbackValidation = Joi.object({
  weekStart: Joi.date().required(),
  weekEnd: Joi.date().greater(Joi.ref("weekStart")).required(),
  workouts: Joi.array().items(WorkoutValidation).default([]),
  nutrition: NutritionValidation.default({ daysCompleted: [], dayNotes: {} }),
  weighIns: Joi.array().items(WeighInValidation).default([]),
  sleepHours: Joi.number().min(0).max(24).allow(null).default(null),
  cardioMinutes: Joi.number().min(0).max(1000).allow(null).default(null),
  cardioMinutesGoal: Joi.number().min(0).max(1000).allow(null).default(null),
  steps: Joi.number().min(0).allow(null).default(null),
  feedbackText: Joi.string().allow("").default(""),
  finalized: Joi.boolean().default(false),
});
