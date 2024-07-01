import { Schema, model } from "mongoose";
import {
  IMuscleGroupWorkoutPlan,
  IDetailedWorkoutPlan,
  IWorkout,
  ISet,
} from "../interfaces/IWorkoutPlan";
import Joi from "joi";

export const setSchema: Schema<ISet> = new Schema({
  minReps: {
    type: Number,
    required: true,
    min: 1,
  },
  maxReps: {
    type: Number,
    required: false,
    min: 1,
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
    default: "",
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
  userId: { type: String, required: true },

  workouts: {
    type: [muscleGroupWorkoutPlanSchema],
    required: true,
  },
});

export const WorkoutPlan = model<IDetailedWorkoutPlan>("workoutPlans", workoutPlanSchema);

const setValidationSchema = Joi.object({
  minReps: Joi.number().min(1).required(),
  maxReps: Joi.number().min(1).optional(),
});

const workoutValidationSchema = Joi.object({
  name: Joi.string().required(),
  sets: Joi.array().items(setValidationSchema).required(),
  linkToVideo: Joi.string().optional(),
  tipFromTrainer: Joi.string().optional(),
});

const muscleGroupWorkoutPlanValidationSchema = Joi.object({
  muscleGroup: Joi.string().required(),
  exercises: Joi.array().items(workoutValidationSchema).min(1).required(),
});

export const WorkoutPlanSchemaValidation = Joi.object({
  userId: Joi.string().required(),
  planName: Joi.string().min(1).max(25).required(),
  workouts: Joi.array().items(muscleGroupWorkoutPlanValidationSchema).min(1).required(),
});
