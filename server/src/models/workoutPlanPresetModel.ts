import { model, Schema } from "mongoose";
import { IDetailedWorkoutPlan, IFullWorkoutPlan } from "../interfaces/IWorkoutPlan";
import {
  cardioPlanSchema,
  cardioPlanValidationSchema,
  workoutPlanSchema,
  WorkoutPlanSchemaValidation,
} from "./workoutPlanModel";
import Joi from "joi";

export interface IWorkoutPlanPreset extends Omit<IFullWorkoutPlan, "userId"> {
  name: string;
}

export const workoutPlanPresetSchema = new Schema<IWorkoutPlanPreset>({
  name: {
    type: String,
    required: true,
    unique: true,
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

export const WorkoutPlanPreset = model("workoutPlanPresets", workoutPlanPresetSchema);

export const WorkoutPlanPresetSchemaValidation = Joi.object({
  name: Joi.string().min(1).required(),
  tips: Joi.array().items(Joi.string()).optional(),
  workoutPlans: Joi.array().items(WorkoutPlanSchemaValidation).min(1).required(),
  cardio: cardioPlanValidationSchema.required(),
});
