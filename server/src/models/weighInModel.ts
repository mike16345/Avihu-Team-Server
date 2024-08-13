import { Schema, model } from "mongoose";
import { IWeighIn, IWeighIns } from "../interfaces/IWeighIns";
import Joi from "joi";

const weighInSchema = new Schema<IWeighIn>({
  date: { type: Date, default: Date.now() },
  weight: { type: Number, min: 1, max: 600 },
});

const weighInsSchema = new Schema<IWeighIns>({
  userId: { type: String },
  weighIns: {
    type: [weighInSchema],
  },
});

export const WeighIns = model("weighIns", weighInsSchema);

export const WeighInSchemaValidation = Joi.object({
  weight: Joi.number().min(1).max(600).required(),
  date: Joi.date().optional(),
});

export const WeighInsSchemaValidation = Joi.object({
  userId: Joi.string().min(1).max(60).required(),
  weighIns: Joi.array().items(WeighInSchemaValidation).required().default([]),
});
