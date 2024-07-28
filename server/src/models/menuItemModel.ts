import Joi, { required } from "joi";
import { model, Schema } from "mongoose";

export const oneServingShcema = new Schema({
  grams: Number,
  spoons: Number,
});

// CR: Make sure the mongoose schema is properly types so it requires certain fields to exist. Here is an example. 
// export const menuItemSchemas = new Schema({
//   dietaryType: { type: String, required: true },
//   foodGroup: String,
//   name: String,
//   oneServing: oneServingShcema,
// });

export const menuItemSchema = new Schema({
  dietaryType: String,
  foodGroup: String,
  name: String,
  oneServing: oneServingShcema,
});

export const fullMenuItemPresets = model(`menuItems`, menuItemSchema);

export const oneServingShcemaValidation = Joi.object({
  grams: Joi.number().min(1).required(),
  spoons: Joi.number().min(1).required(),
});

export const menuItemShcemaValidation = Joi.object({
  dietaryType: Joi.string().min(1).required(),
  foodGroup: Joi.string().min(1).required(),
  name: Joi.string().min(1).required(),
  oneServing: oneServingShcemaValidation,
});
