import { Schema, model } from "mongoose";
import { IWeighIn, IWeighIns } from "../interfaces/IWeighIns";
import Joi from "joi";

const weighInSchema = new Schema<IWeighIn>({
  date: { type: Date, default: Date.now() },
  weight: Number,
});

const weighInsSchema = new Schema<IWeighIns>({
  userId: { type: String },
  weighIns: [weighInSchema],
});

export const WeighIns = model("weighIns", weighInsSchema);

export const WeighInSchemaValidation = Joi.object({
  userId: Joi.string().min(1).max(60),
  weight: Joi.number().min(1).max(600),
});
