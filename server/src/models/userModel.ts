import { IUser } from "../interfaces/IUser";

import { Schema, model } from "mongoose";
import Joi from "joi";

const userSchema = new Schema<IUser>({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  profileImage: {
    type: String,
    required: false,
    unique: true,
  },
  dietaryType: {
    type: [String],
    required: true,
  },

  hasAccess: {
    type: Boolean,
    required: false,
    default: true,
  },
  dateJoined: {
    type: Date,
    default: Date.now,
  },
  dateFinished: {
    type: Date,
    required: true,
  },
  planType: {
    type: String,
    required: true,
  },
  remindIn: {
    type: Number,
    required: true,
  },
  checkInAt: {
    type: Number,
    required: true,
  },
  isChecked: {
    type: Boolean,
    default: false,
    required: true,
  },
  imagesUploaded: {
    type: Boolean,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  completedOnboarding: {
    type: Boolean,
    default: false,
  },
});

export const User = model("users", userSchema);

const phoneRegex = /^\+?[0-9\s\-().]{7,20}$/;

export const UserSchemaValidation = Joi.object({
  firstName: Joi.string().min(2).max(25),
  lastName: Joi.string().min(2).max(25),
  email: Joi.string().min(5).max(30).email(),
  phone: Joi.string().pattern(phoneRegex),
  dietaryType: Joi.array().items(Joi.string()),
  dateFinished: Joi.date(),
  planType: Joi.string(),
  remindIn: Joi.number().min(259200).max(2678400).required(),
  checkInAt: Joi.number(),
  isChecked: Joi.boolean(),
  hasAccess: Joi.boolean(),
  imagesUploaded: Joi.boolean(),
  profileImage: Joi.string().optional(),
  isAdmin: Joi.boolean(),
  completedOnboarding: Joi.boolean().optional(),
});
