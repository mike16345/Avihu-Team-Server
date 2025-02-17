import { Schema, model } from "mongoose";
import {
  IMuscleGroupWorkoutPlan,
  IDetailedWorkoutPlan,
  IWorkout,
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

export const workoutSchema: Schema<IWorkout> = new Schema({
  name: {
    type: String,
    required: true,
  },
  sets: {
    type: [setSchema],
    required: true,
  },
  linkToVideo: {
    type: String,
    required: false,
    default: "",
  },
  tipFromTrainer: {
    type: String,
    required: false,
  },
  exerciseMethod: {
    type: String,
    minlength: 1,
  },
});

export const muscleGroupWorkoutPlanSchema: Schema<IMuscleGroupWorkoutPlan> = new Schema({
  muscleGroup: {
    type: String,
    required: true,
  },
  exercises: {
    type: [workoutSchema],
    required: true,
    validate: {
      validator: function (v: IWorkout[]) {
        return v.length > 0;
      },
      message: "Workouts array cannot be empty",
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
      message: "Workouts array cannot be empty",
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

// Cardio Plan Schema (Supports Simple or Complex)
export const cardioPlanSchema = new Schema({
  type: { type: String, enum: ["simple", "complex"], required: true },
  plan: { type: Schema.Types.Mixed, required: true }, // Either Simple or Complex
});

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
});

export const setValidationSchema = Joi.object({
  minReps: Joi.number().min(1).required(),
  maxReps: Joi.number().allow(0).greater(Joi.ref("minReps")).optional(),
});

export const workoutValidationSchema = Joi.object({
  name: Joi.string().required(),
  sets: Joi.array().items(setValidationSchema).required(),
  linkToVideo: Joi.string().optional(),
  tipFromTrainer: Joi.string().allow("").optional(),
  exerciseMethod: Joi.string().min(1).optional().allow(""),
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

export const cardioPlanValidationSchema = Joi.object({
  type: Joi.string().valid("simple", "complex").required(),
  plan: Joi.alternatives().conditional("type", {
    switch: [
      { is: "simple", then: simpleCardioValidationSchema },
      { is: "complex", then: complexCardioValidationSchema },
    ],
    otherwise: Joi.forbidden(),
  }),
});

export const WorkoutPlanSchemaValidation = Joi.object({
  planName: Joi.string().min(1).max(25).required(),
  muscleGroups: Joi.array().items(muscleGroupWorkoutPlanValidationSchema).min(1).required(),
});

export const FullWorkoutPlanSchemaValidation = Joi.object({
  tips: Joi.array().items(Joi.string()).optional(),
  workoutPlans: Joi.array().items(WorkoutPlanSchemaValidation).min(1).required(),
  cardio: cardioPlanValidationSchema.required(),
});

export const WorkoutPlan = model<IFullWorkoutPlan>("workoutPlans", fullWorkoutPlanSchema);
