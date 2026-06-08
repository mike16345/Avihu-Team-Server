import Joi from "joi";
import { Schema, model } from "mongoose";
import {
  ITrainer,
  TRAINER_SOURCES,
  TRAINER_STATUSES,
  TRAINER_SUBSCRIPTION_PLANS,
} from "../interfaces/ITrainer";

export const trainerSchema = new Schema<ITrainer>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 256,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 64,
    },
    isDeleted: {
      type: Boolean,
      required: false,
      default: false,
    },
    subscriptionPlan: {
      type: String,
      required: true,
      enum: TRAINER_SUBSCRIPTION_PLANS,
    },
    clientLimit: {
      type: Number,
      required: true,
      min: 0,
    },
    subTrainerLimit: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      enum: TRAINER_STATUSES,
    },
    source: {
      type: String,
      required: true,
      enum: TRAINER_SOURCES,
    },
    videoLibraryAccess: {
      type: Boolean,
      required: true,
      default: false,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: false,
    },
    /**
     * Workout-preset IDs starred as favourites by this trainer.
     * Backwards-compatible — older docs default to an empty list.
     */
    favoriteWorkoutPresetIds: {
      type: [Schema.Types.ObjectId],
      ref: "workoutPlanPresets",
      default: [],
    },
    /**
     * When true, sub-trainers see this trainer's favourites as a
     * read-only "team favourites" list. Off until the trainer opts in.
     */
    sharesFavorites: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

trainerSchema.index({ email: 1 }, { unique: true });
trainerSchema.index({ phone: 1 }, { unique: true });
trainerSchema.index({ userId: 1 }, { unique: true, sparse: true });

export const TrainerModel = model<ITrainer>("trainers", trainerSchema);

const phoneRegex = /^\+?[0-9\s\-().]{7,20}$/;

export const TrainerSchemaValidation = Joi.object({
  fullName: Joi.string().trim().min(2).max(120).required(),
  email: Joi.string().trim().lowercase().min(5).max(256).email().required(),
  phone: Joi.string().trim().pattern(phoneRegex).required(),
  isDeleted: Joi.boolean().optional(),
  subscriptionPlan: Joi.string()
    .valid(...TRAINER_SUBSCRIPTION_PLANS)
    .required(),
  clientLimit: Joi.number().integer().min(0).required(),
  subTrainerLimit: Joi.number().integer().min(0).required(),
  status: Joi.string()
    .valid(...TRAINER_STATUSES)
    .required(),
  source: Joi.string()
    .valid(...TRAINER_SOURCES)
    .required(),
  videoLibraryAccess: Joi.boolean().required(),
  userId: Joi.string().optional(),
  favoriteWorkoutPresetIds: Joi.array().items(Joi.string()).optional(),
  sharesFavorites: Joi.boolean().optional(),
}).prefs({ abortEarly: false, stripUnknown: true });
