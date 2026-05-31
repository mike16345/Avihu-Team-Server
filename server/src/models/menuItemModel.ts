import Joi from "joi";
import { model, Schema } from "mongoose";
import { ICustomItemInstructions } from "../interfaces/IDietPlan";
import { IModel } from "../interfaces/IModel";

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
  units: {
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

export const menuItemSchema = new Schema<ICustomItemInstructions & IModel>({
  dietaryType: {
    type: [String],
  },
  trainerId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "trainers",
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
  units: Joi.number().min(1),
});

export const menuItemShcemaValidation = Joi.object({
  dietaryType: Joi.array().items(Joi.string()),
  foodGroup: Joi.string().min(1).required(),
  name: Joi.string().min(1).required(),
  oneServing: oneServingShcemaValidation,
});
