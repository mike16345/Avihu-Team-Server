import Joi from "joi";
import { model, Schema } from "mongoose";
import { IExercisePreset } from "../interfaces/IWorkoutPlan";

export const exercisePresetSchema = new Schema<IExercisePreset>({
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
  muscleGroup: {
    type: String,
    required: true,
    minlength: 1,
  },
  imageUrl: {
    type: String,
  },
  tipFromTrainer:{
    type:String,
    required:false,
  }
});

export const exercisePresets = model(`exercisePresets`, exercisePresetSchema);

const youtubeUrlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;

export const exercisePresetValidationSchema = Joi.object({
  name: Joi.string().min(1).required(),
  linkToVideo: Joi.string().min(27).pattern(youtubeUrlPattern).required(),
  muscleGroup: Joi.string().min(1).required(),
  imageUrl: Joi.string().allow(""),
  tipFromTrainer:Joi.string().allow(""),

});
