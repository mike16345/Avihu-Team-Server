import Joi, {   } from "joi";
import { model, Schema } from "mongoose";

export const oneServingShcema= new Schema({
    grams: Number,
    spoons: Number
})

export const menuItemSchema = new Schema({
    type:String,
    itemName:String,
    oneServing: oneServingShcema
})

export const fullMenuItemsSchema = new Schema({
    protein:[menuItemSchema],
    carbs:[menuItemSchema],
    fats:[menuItemSchema],
    vegetables:[menuItemSchema],
})

export const fullMenuItemPresets = model(`menuItemPresets`, fullMenuItemsSchema);

export const oneServingShcemaValidation = Joi.object({
    grams: Joi.number().min(1).required(),
    spoons: Joi.number().min(1).required(),
})

export const menuItemShcemaValidation = Joi.object({
    type: Joi.string().min(1).required(),
    itemName: Joi.string().min(1).required(),
    oneServing: oneServingShcemaValidation
})