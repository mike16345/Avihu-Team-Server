import { model, Schema } from "mongoose";
import { IDetailedWorkoutPlan, IFullWorkoutPlan } from "../interfaces/IWorkoutPlan";
import {
  cardioPlanSchema,
  cardioPlanValidationSchema,
  workoutMetaFields,
  workoutMetaValidationFields,
  workoutPlanSchema,
  WorkoutPlanSchemaValidation,
} from "./workoutPlanModel";
import Joi from "joi";
import { IModel } from "../interfaces/IModel";

export interface IWorkoutPlanPreset extends Omit<IFullWorkoutPlan, "userId"> {
  name: string;
}

export const workoutPlanPresetSchema = new Schema<IWorkoutPlanPreset & IModel>({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  trainerId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "trainers",
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
  // Trainer-tagged meta (frequency / level / goal / equipment / focus / notes)
  ...workoutMetaFields,
});

export const WorkoutPlanPreset = model("workoutPlanPresets", workoutPlanPresetSchema);

export const WorkoutPlanPresetSchemaValidation = Joi.object({
  name: Joi.string().min(1).required(),
  tips: Joi.array().items(Joi.string()).optional(),
  workoutPlans: Joi.array().items(WorkoutPlanSchemaValidation).min(1).required(),
  cardio: cardioPlanValidationSchema.required(),
  ...workoutMetaValidationFields,
});
