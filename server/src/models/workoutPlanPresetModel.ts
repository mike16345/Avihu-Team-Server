import { model, Schema } from "mongoose";
import { IDetailedWorkoutPlan, IFullWorkoutPlan } from "../interfaces/IWorkoutPlan";
import {
  cardioPlanSchema,
  cardioPlanValidationSchema,
  workoutBlockSchema,
  workoutBlockValidationSchema,
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
  /**
   * Optional block-based periodization. See `workoutBlockSchema` in
   * `workoutPlanModel.ts` for the block shape. Same semantics as the
   * per-user plan — omitting these keeps the preset unified.
   */
  mode: { type: String, enum: ["unified", "blocks"], required: false },
  blocks: { type: [workoutBlockSchema], required: false },
  activeBlockIndex: { type: Number, min: 0, max: 7, required: false },
  ...workoutMetaFields,
});

export const WorkoutPlanPreset = model("workoutPlanPresets", workoutPlanPresetSchema);

export const WorkoutPlanPresetSchemaValidation = Joi.object({
  name: Joi.string().min(1).required(),
  tips: Joi.array().items(Joi.string()).optional(),
  workoutPlans: Joi.array().items(WorkoutPlanSchemaValidation).min(1).required(),
  cardio: cardioPlanValidationSchema.required(),
  mode: Joi.string().valid("unified", "blocks").optional(),
  blocks: Joi.array().items(workoutBlockValidationSchema).max(8).optional(),
  activeBlockIndex: Joi.number().min(0).max(7).optional(),
  ...workoutMetaValidationFields,
}).custom((value, helpers) => {
  const { activeBlockIndex, blocks } = value;
  if (typeof activeBlockIndex === "number") {
    const blockCount = Array.isArray(blocks) ? blocks.length : 0;
    if (blockCount === 0 || activeBlockIndex >= blockCount) {
      return helpers.error("any.invalid", {
        message: "activeBlockIndex must point to an existing block",
      });
    }
  }
  return value;
}, "activeBlockIndex bounds check");
