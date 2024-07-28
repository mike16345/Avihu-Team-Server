import Joi, { required } from "joi";
import { model, Schema } from "mongoose";


export const exercisePresetSchema = new Schema({
    name: String
})

export const exercisePresets = model(`exercisePresets`, exercisePresetSchema);

export const exercisePresetValidationSchema = Joi.object({
    name: Joi.string().min(1).required()
})