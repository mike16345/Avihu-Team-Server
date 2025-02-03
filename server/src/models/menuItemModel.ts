import Joi from "joi";
import { model, Schema } from "mongoose";

export const oneServingShcema = new Schema({
  grams: {
    type: Number,
    min: 1,
  },
  scoops: {
    type: Number,
    min: 1,
  },
  pieces: {
    type: Number,
    min: 1,
  },
  cups: {
    type: Number,
    min: 1,
  },
  teaSpoons: {
    type: Number,
    min: 1,
  },
  spoons: {
    type: Number,
    min: 1,
  },
});

export const menuItemSchema = new Schema({
  dietaryType: {
    type: [String],
  },
  foodGroup: {
    type: String,
    required: true,
    minlength: 1,
  },
  name: {
    type: String,
    required: true,
    minlength: 1,
  },
  oneServing: oneServingShcema,
});

export const fullMenuItemPresets = model(`menuItems`, menuItemSchema);

export const oneServingShcemaValidation = Joi.object({
  grams: Joi.number().min(1),
  spoons: Joi.number().min(1),
  pieces: Joi.number().min(1),
  cups: Joi.number().min(1),
  scoops: Joi.number().min(1),
  teaSpoons: Joi.number().min(1),
});

export const menuItemShcemaValidation = Joi.object({
  dietaryType: Joi.array().items(Joi.string()),
  foodGroup: Joi.string().min(1).required(),
  name: Joi.string().min(1).required(),
  oneServing: oneServingShcemaValidation,
});
