const { Schema, model } = require("mongoose");
const Joi = require("joi");

const userSchema = new Schema({
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
  },
  dietaryType: {
    type: [String],
    required: true,
  },
  password: {
    type: String,
    required: false,
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
});

exports.User = model("users", userSchema);

exports.UserSchemaValidation = Joi.object({
  firstName: Joi.string().min(2).max(25),
  lastName: Joi.string().min(2).max(25),
  email: Joi.string().min(5).max(30).email(),
  password: Joi.string().optional(),
  phone: Joi.string().pattern(/^0[0-9]{9}$/),
  dietaryType: Joi.array().items(Joi.string()),
  dateFinished: Joi.date(),
  planType: Joi.string(),
  remindIn: Joi.number().min(259200).max(2678400).required(),
});
