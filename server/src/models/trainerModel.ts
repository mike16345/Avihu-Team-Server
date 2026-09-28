import Joi from "joi";
import { Schema, model } from "mongoose";
import {
  BLOCK_BACKGROUND_STATUSES,
  IBlockBackground,
  IBlockTipDefault,
  IDietTipGoal,
  ITrainer,
  TRAINER_DIET_PLAN_VERSIONS,
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
    dietPlanVersion: {
      type: Number,
      required: true,
      enum: TRAINER_DIET_PLAN_VERSIONS,
      default: 1,
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
     * Diet-plan preset IDs starred as favourites by this trainer.
     * Backwards-compatible — older docs default to an empty list.
     */
    favoriteDietPresetIds: {
      type: [Schema.Types.ObjectId],
      ref: "dietPlanPresets",
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
    blockBackgrounds: {
      type: [
        new Schema<IBlockBackground>(
          {
            status: {
              type: String,
              required: true,
              enum: BLOCK_BACKGROUND_STATUSES,
            },
            url: {
              type: String,
              required: true,
              trim: true,
              maxlength: 512,
            },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    blockTipDefaults: {
      type: [
        new Schema<IBlockTipDefault>(
          {
            status: {
              type: String,
              required: true,
              enum: BLOCK_BACKGROUND_STATUSES,
            },
            tips: {
              type: [{ type: String, trim: true, maxlength: 20000 }],
              default: [],
            },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    dietTipGoals: {
      type: [
        new Schema<IDietTipGoal>(
          {
            key: { type: String, required: true, trim: true, maxlength: 64 },
            label: { type: String, required: true, trim: true, maxlength: 120 },
            tips: {
              type: [{ type: String, trim: true, maxlength: 20000 }],
              default: [],
            },
          },
          { _id: false }
        ),
      ],
      default: [],
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
  dietPlanVersion: Joi.number()
    .valid(...TRAINER_DIET_PLAN_VERSIONS)
    .default(1),
  userId: Joi.string().optional(),

  favoriteWorkoutPresetIds: Joi.array().items(Joi.string()).optional(),
  favoriteDietPresetIds: Joi.array().items(Joi.string()).optional(),
  sharesFavorites: Joi.boolean().optional(),
  blockBackgrounds: Joi.array()
    .items(
      Joi.object({
        status: Joi.string()
          .valid(...BLOCK_BACKGROUND_STATUSES)
          .required(),
        url: Joi.string().trim().max(512).required(),
      })
    )
    .optional(),
  blockTipDefaults: Joi.array()
    .items(
      Joi.object({
        status: Joi.string()
          .valid(...BLOCK_BACKGROUND_STATUSES)
          .required(),
        tips: Joi.array().items(Joi.string().trim().max(20000)).default([]),
      })
    )
    .optional(),
  dietTipGoals: Joi.array()
    .items(
      Joi.object({
        key: Joi.string().trim().max(64).required(),
        label: Joi.string().trim().max(120).required(),
        tips: Joi.array().items(Joi.string().trim().max(20000)).default([]),
      })
    )
    .optional(),
}).prefs({ abortEarly: false, stripUnknown: true });

export const DietTipGoalValidation = Joi.object({
  key: Joi.string().trim().max(64).required(),
  label: Joi.string().trim().max(120).required(),
  tips: Joi.array().items(Joi.string().trim().max(20000)).required(),
});

export const BlockBackgroundValidation = Joi.object({
  status: Joi.string()
    .valid(...BLOCK_BACKGROUND_STATUSES)
    .required(),
  url: Joi.string().trim().max(512).required(),
});

export const BlockTipDefaultValidation = Joi.object({
  status: Joi.string()
    .valid(...BLOCK_BACKGROUND_STATUSES)
    .required(),
  tips: Joi.array().items(Joi.string().trim().max(20000)).required(),
});
