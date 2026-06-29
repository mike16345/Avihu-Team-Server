import { Schema, model } from "mongoose";
import {
  IMuscleGroupWorkoutPlan,
  IDetailedWorkoutPlan,
  IExercise,
  IFullWorkoutPlan,
} from "../interfaces/IWorkoutPlan";
import Joi from "joi";
import { ISet } from "../interfaces/ISet";

export const setSchema: Schema<ISet> = new Schema({
  minReps: {
    type: Number,
    required: true,
    min: 1,
  },
  maxReps: {
    type: Number,
    required: false,
    min: 0,
  },
});

export const exerciseSchema: Schema<IExercise> = new Schema({
  exerciseId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "exercisePresets",
  },
  sets: {
    type: [setSchema],
    required: true,
  },
  tipFromTrainer: {
    type: String,
    required: false,
  },
  exerciseMethod: {
    type: String,
    minlength: 1,
    required: false,
  },
  restTime: {
    type: Number,
    default: 60,
  },
});

export const muscleGroupWorkoutPlanSchema: Schema<IMuscleGroupWorkoutPlan> = new Schema({
  muscleGroup: {
    type: String,
    required: true,
  },
  exercises: {
    type: [exerciseSchema],
    required: true,
    validate: {
      validator: function (v: IExercise[]) {
        return v.length > 0;
      },
      message: "Exercises array cannot be empty",
    },
  },
});

export const workoutPlanSchema: Schema<IDetailedWorkoutPlan> = new Schema({
  planName: {
    type: String,
    required: true,
  },

  muscleGroups: {
    type: [muscleGroupWorkoutPlanSchema],
    validate: {
      validator: function (v: IMuscleGroupWorkoutPlan[]) {
        return v.length > 0;
      },
      message: "Muscle Groups array cannot be empty",
    },
    required: true,
  },
});

// Simple Cardio Schema
export const simpleCardioSchema = new Schema({
  minsPerWeek: { type: Number, required: true },
  timesPerWeek: { type: Number, required: true },
  minsPerWorkout: { type: Number },
  tips: { type: String },
});

// Cardio Workout Schema
export const cardioWorkoutSchema = new Schema({
  name: { type: String, required: true },
  warmUpAmount: { type: Number },
  distance: { type: String, required: true },
  cardioExercise: { type: String, required: true },
  tips: { type: String },
});

// Cardio Week Schema
export const cardioWeekSchema = new Schema({
  week: { type: String, required: true },
  workouts: { type: [cardioWorkoutSchema], required: true },
});

// Complex Cardio Schema
export const complexCardioSchema = new Schema({
  weeks: { type: [cardioWeekSchema], required: true },
  tips: { type: String },
});

// Steps Cardio Schema
export const stepsCardioSchema = new Schema({
  mode: { type: String, enum: ["uniform", "custom"], required: true },
  daily: { type: Number, required: true, min: 1 },
  perDay: {
    type: [Number],
    validate: {
      validator: function (value?: number[]) {
        return value === undefined || value.length === 7;
      },
      message: "Steps per-day targets must include exactly 7 values",
    },
  },
  tips: { type: String },
});

// Cardio Plan Schema (Supports Simple, Complex, or Steps)
export const cardioPlanSchema = new Schema({
  type: { type: String, enum: ["simple", "complex", "steps"], required: true },
  plan: { type: Schema.Types.Mixed, required: true },
});

/**
 * Optional trainer-tagged meta fields used by the admin panel to
 * filter/scan presets (frequency, level, goal, equipment, focus,
 * notes, limitations). All optional — backwards-compatible with
 * older docs that don't have any of these set.
 */
export const workoutMetaFields = {
  workoutsPerWeek: { type: Number, min: 1, max: 7 },
  durationMinutes: { type: Number, min: 10, max: 240 },
  level: { type: String, enum: ["beginner", "intermediate", "advanced", "pro"] },
  goal: {
    type: String,
    enum: ["fat-loss", "muscle-gain", "strength", "endurance", "toning", "rehab"],
  },
  equipment: {
    type: String,
    enum: ["gym", "studio", "weights", "bodyweight", "weights-bodyweight"],
  },
  muscleFocus: { type: [String], default: undefined },
  note: { type: String, maxlength: 500 },
  limitations: { type: String, maxlength: 500 },
  builtByTrainerId: { type: String },
};

/**
 * History / temporary-swap fields. Council decision: keep one
 * collection (`workoutPlans`), one trainee can have many docs over
 * time but only ONE doc with `archivedAt = null` per userId — that's
 * the doc the mobile app reads. Older docs become history.
 *
 * - archivedAt: when this plan stopped being active (null = active).
 * - replacedByPlanId: pointer to the doc that replaced this one.
 * - assignedBy: trainer id who created this assignment (audit trail).
 * - assignedAt: when this assignment became active.
 * - temporaryUntil: optional end-date for a temporary swap. Surfaces
 *   the orange banner in the trainer UI; restore is MANUAL (no cron).
 * - restoreToPlanId: when this is a temporary plan, points to the
 *   archived doc the trainer wants to restore when finished.
 * - assignmentLabel: optional human label ("Full-Body חודש יוני")
 *   shown in the history list.
 *
 * All optional — older docs keep working unchanged.
 */
export const workoutHistoryFields = {
  archivedAt: { type: Date, default: null },
  replacedByPlanId: { type: Schema.Types.ObjectId, ref: "workoutPlans" },
  assignedBy: { type: String },
  assignedAt: { type: Date, default: Date.now },
  temporaryUntil: { type: Date },
  restoreToPlanId: { type: Schema.Types.ObjectId, ref: "workoutPlans" },
  assignmentLabel: { type: String, maxlength: 120 },
};

export const fullWorkoutPlanSchema: Schema<IFullWorkoutPlan> = new Schema({
  userId: {
    type: String,
    required: true,
  },
  tips: {
    type: [String],
  },
  workoutPlans: {
    type: [workoutPlanSchema],
    validate: {
      validator: function (v: IDetailedWorkoutPlan[]) {
        return v.length > 0;
      },
      message: "Workout plans array cannot be empty",
    },
    required: true,
  },
  cardio: {
    type: cardioPlanSchema,
    required: true,
  },
  ...workoutMetaFields,
  ...workoutHistoryFields,
});

// Compound index: each trainee can have at most ONE active plan
// (archivedAt: null). Mobile reads { userId, archivedAt: null } and
// gets exactly one doc back. History queries: { userId } sorted by
// assignedAt desc, filtered to archivedAt != null.
fullWorkoutPlanSchema.index({ userId: 1, archivedAt: 1 }, { name: "userId_archivedAt_idx" });

export const setValidationSchema = Joi.object({
  minReps: Joi.number().min(1).required(),
  maxReps: Joi.number().allow(0).greater(Joi.ref("minReps")).optional(),
});

export const workoutValidationSchema = Joi.object({
  name: Joi.string().optional(),
  sets: Joi.array().items(setValidationSchema).required(),
  linkToVideo: Joi.string().optional(),
  tipFromTrainer: Joi.string().allow("").optional(),
  exerciseMethod: Joi.string().min(1).optional().allow(""),
  restTime: Joi.number().min(1).max(300),
  exerciseId: Joi.alternatives()
    .try(
      Joi.string().required(),
      Joi.object({
        name: Joi.string(),
        linkToVideo: Joi.string(),
        _id: Joi.string(),
      })
    )
    .required(),
});

export const muscleGroupWorkoutPlanValidationSchema = Joi.object({
  muscleGroup: Joi.string().required(),
  exercises: Joi.array().items(workoutValidationSchema).min(1).required(),
});

export const simpleCardioValidationSchema = Joi.object({
  minsPerWeek: Joi.number().min(1).required(),
  timesPerWeek: Joi.number().min(1).required(),
  minsPerWorkout: Joi.number().min(1),
  tips: Joi.string().allow(""),
});

export const cardioWorkoutValidationSchema = Joi.object({
  name: Joi.string().required(),
  warmUpAmount: Joi.number().min(0),
  distance: Joi.string().required(),
  cardioExercise: Joi.string().required(),
  tips: Joi.string().allow(""),
});

export const cardioWeekValidationSchema = Joi.object({
  week: Joi.string().required(),
  workouts: Joi.array().items(cardioWorkoutValidationSchema).min(1).required(),
});

export const complexCardioValidationSchema = Joi.object({
  weeks: Joi.array().items(cardioWeekValidationSchema).min(1).required(),
  tips: Joi.string().allow(""),
});

export const stepsCardioValidationSchema = Joi.object({
  mode: Joi.string().valid("uniform", "custom").required(),
  daily: Joi.number().integer().min(1).required(),
  perDay: Joi.when("mode", {
    is: "custom",
    then: Joi.array().items(Joi.number().integer().min(1)).length(7).required(),
    otherwise: Joi.array().items(Joi.number().integer().min(1)).length(7).optional(),
  }),
  tips: Joi.string().allow(""),
});

export const cardioPlanValidationSchema = Joi.object({
  type: Joi.string().valid("simple", "complex", "steps").required(),
  plan: Joi.alternatives().conditional("type", {
    switch: [
      { is: "simple", then: simpleCardioValidationSchema },
      { is: "complex", then: complexCardioValidationSchema },
      { is: "steps", then: stepsCardioValidationSchema },
    ],
    otherwise: Joi.forbidden(),
  }),
});

export const WorkoutPlanSchemaValidation = Joi.object({
  planName: Joi.string().min(1).max(75).required(),
  muscleGroups: Joi.array().items(muscleGroupWorkoutPlanValidationSchema).min(1).required(),
});

/** Optional meta fields — kept in sync with `workoutMetaFields` above. */
export const workoutMetaValidationFields = {
  workoutsPerWeek: Joi.number().min(1).max(7).optional(),
  durationMinutes: Joi.number().min(10).max(240).optional(),
  level: Joi.string().valid("beginner", "intermediate", "advanced", "pro").optional(),
  goal: Joi.string()
    .valid("fat-loss", "muscle-gain", "strength", "endurance", "toning", "rehab")
    .optional(),
  equipment: Joi.string()
    .valid("gym", "studio", "weights", "bodyweight", "weights-bodyweight")
    .optional(),
  muscleFocus: Joi.array().items(Joi.string()).max(3).optional(),
  note: Joi.string().max(500).allow("").optional(),
  limitations: Joi.string().max(500).allow("").optional(),
  builtByTrainerId: Joi.string().optional(),
};

/** History / temporary-swap fields — kept in sync with workoutHistoryFields. */
export const workoutHistoryValidationFields = {
  archivedAt: Joi.date().allow(null).optional(),
  replacedByPlanId: Joi.string().optional(),
  assignedBy: Joi.string().optional(),
  assignedAt: Joi.date().optional(),
  temporaryUntil: Joi.date().optional(),
  restoreToPlanId: Joi.string().optional(),
  assignmentLabel: Joi.string().max(120).allow("").optional(),
};

export const FullWorkoutPlanSchemaValidation = Joi.object({
  tips: Joi.array().items(Joi.string()).optional(),
  workoutPlans: Joi.array().items(WorkoutPlanSchemaValidation).min(1).required(),
  cardio: cardioPlanValidationSchema.required(),
  ...workoutMetaValidationFields,
  ...workoutHistoryValidationFields,
});

export const WorkoutPlan = model<IFullWorkoutPlan>("workoutPlans", fullWorkoutPlanSchema);
