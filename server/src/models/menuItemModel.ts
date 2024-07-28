import Joi, { required, string } from "joi";
import { model, Schema } from "mongoose";

export const oneServingShcema = new Schema({
  grams: {
    type: Number,
    required: true,
    min: 1
  },
  spoons: {
    type: Number,
    required: true,
    min: 1
  },
});



export const menuItemSchema = new Schema({
  dietaryType: {
    type: [String],
  },
  foodGroup: {
    type: String,
    required: true,
    minlength: 1
  },
  name: {
    type: String,
    required: true,
    minlength: 1
  },
  oneServing: oneServingShcema,
});

export const fullMenuItemPresets = model(`menuItems`, menuItemSchema);

export const oneServingShcemaValidation = Joi.object({
  grams: Joi.number().min(1).required(),
  spoons: Joi.number().min(1).required(),
});

export const menuItemShcemaValidation = Joi.object({
  dietaryType: Joi.array().items(Joi.string()),
  foodGroup: Joi.string().min(1).required(),
  name: Joi.string().min(1).required(),
  oneServing: oneServingShcemaValidation,
});
