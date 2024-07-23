import Joi, { } from "joi";
import { model, Schema } from "mongoose";

export const oneServingShcema = new Schema({
    grams: Number,
    spoons: Number
})

export const menuItemSchema = new Schema({
    dietaryType: String,
    foodGroup: String,
    itemName: String,
    oneServing: oneServingShcema
})



export const fullMenuItemPresets = model(`menuItems`, menuItemSchema);

export const oneServingShcemaValidation = Joi.object({
    grams: Joi.number().min(1).required(),
    spoons: Joi.number().min(1).required(),
})

export const menuItemShcemaValidation = Joi.object({
    dietaryType: Joi.string().min(1).required(),
    foodGroup: Joi.string().min(1).required(),
    itemName: Joi.string().min(1).required(),
    oneServing: oneServingShcemaValidation
})