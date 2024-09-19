import Joi, { required } from "joi";
import { model, Schema } from "mongoose";

export const exercisePresetSchema = new Schema({
  name: {
    type: String,
    required: true,
    minlength: 1,
  },
  linkToVideo: {
    type: String,
    required: true,
    minlength: 27,
  },
  tipFromTrainer: {
    type: String,
    minlength: 1,
  },
  muscleGroup: {
    type: String,
    required: true,
    minlength: 1,
  },
});

export const exercisePresets = model(`exercisePresets`, exercisePresetSchema);

const youtubeUrlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
export const exercisePresetValidationSchema = Joi.object({
  name: Joi.string().min(1).required(),
  linkToVideo: Joi.string().min(27).pattern(youtubeUrlPattern).required(),
  tipsFromTrainer: Joi.string().min(1),
  muscleGroup: Joi.string().min(1).required(),
});
