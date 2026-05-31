import Joi from "joi";
import { model, Schema } from "mongoose";
import { EXERCISE_LIBRARY_SCOPES, IExercisePreset } from "../interfaces/IWorkoutPlan";
import { IModel } from "../interfaces/IModel";

export const exercisePresetSchema = new Schema<IExercisePreset & IModel>({
  name: {
    type: String,
    required: true,
    minlength: 1,
  },
  trainerId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "trainers",
  },
  linkToVideo: {
    type: String,
    required: true,
    minlength: 27,
  },
  muscleGroup: {
    type: String,
    required: true,
    minlength: 1,
  },
  imageUrl: {
    type: String,
  },
  tipFromTrainer: {
    type: String,
    required: false,
  },
  libraryScope: {
    type: String,
    enum: EXERCISE_LIBRARY_SCOPES,
    default: "private",
    required: true,
  },
  sourceExerciseId: {
    type: Schema.Types.ObjectId,
    ref: "exercisePresets",
    required: false,
  },
  sourceOwnerId: {
    type: Schema.Types.ObjectId,
    ref: "trainers",
    required: false,
  },
});

exercisePresetSchema.index(
  { trainerId: 1, sourceExerciseId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      sourceExerciseId: { $exists: true },
    },
  }
);

export const exercisePresets = model(`exercisePresets`, exercisePresetSchema);

const youtubeUrlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;

export const exercisePresetValidationSchema = Joi.object({
  name: Joi.string().min(1).required(),
  linkToVideo: Joi.string().min(27).pattern(youtubeUrlPattern).required(),
  muscleGroup: Joi.string().min(1).required(),
  imageUrl: Joi.string().allow(""),
  tipFromTrainer: Joi.string().allow(""),
  libraryScope: Joi.string()
    .valid(...EXERCISE_LIBRARY_SCOPES)
    .optional(),
});
