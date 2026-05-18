import Joi from "joi";
import { Schema, model } from "mongoose";
import {
  ISubTrainer,
  SUB_TRAINER_POSITIONS,
  SUB_TRAINER_STATUSES,
} from "../interfaces/ISubTrainer";

export const subTrainerSchema = new Schema<ISubTrainer>(
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
    position: {
      type: String,
      required: true,
      enum: SUB_TRAINER_POSITIONS,
    },
    status: {
      type: String,
      required: true,
      enum: SUB_TRAINER_STATUSES,
      default: "active",
    },
    trainerId: {
      type: Schema.Types.ObjectId,
      ref: "trainers",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

subTrainerSchema.index({ trainerId: 1 });
subTrainerSchema.index({ userId: 1 }, { unique: true, sparse: true });

export const SubTrainerModel = model<ISubTrainer>("subTrainers", subTrainerSchema);

const phoneRegex = /^\+?[0-9\s\-().]{7,20}$/;

export const SubTrainerSchemaValidation = Joi.object({
  fullName: Joi.string().trim().min(2).max(120).required(),
  email: Joi.string().trim().lowercase().min(5).max(256).email().required(),
  phone: Joi.string().trim().pattern(phoneRegex).required(),
  isDeleted: Joi.boolean().optional(),
  position: Joi.string()
    .valid(...SUB_TRAINER_POSITIONS)
    .required(),
  status: Joi.string()
    .valid(...SUB_TRAINER_STATUSES)
    .default("active"),
  trainerId: Joi.string().required(),
  userId: Joi.string().optional(),
}).prefs({ abortEarly: false, stripUnknown: true });
