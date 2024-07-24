import Joi, { required } from "joi";
import { model, Schema } from "mongoose";


export const exercisePresetSchema = new Schema({
    itemName: String,
    linkToVideo: String,
    tipsFromTrainer: String,
    muscleGroup: String
})

export const exercisePresets = model(`exercisePresets`, exercisePresetSchema);

export const exercisePresetValidationSchema = Joi.object({
    itemName: Joi.string().min(1).required(),
    linkToVideo: Joi.string().min(1).required(),
    tipsFromTrainer: Joi.string().min(1).required(),
    muscleGroup: Joi.string().min(1),
})