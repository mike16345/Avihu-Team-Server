import { model, Schema } from "mongoose";
import { IProgressNote, IProgressNotes } from "../interfaces/userProgress";
import Joi from "joi";

const progressOptions = {
  type: Number,
  enum: [25, 50, 75, 100],
};

const progressNote = new Schema<IProgressNote>({
  date: {
    type: Date,
    required: true,
  },
  trainer: {
    type: String,
  },
  diet: progressOptions,
  workouts: progressOptions,
  cardio: progressOptions,
  content: {
    type: String,
    required: true,
  },
});

const progressNotes = new Schema<IProgressNotes>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  progressNotes: [progressNote],
});

export const ProgressNote = model(`progressNotes`, progressNotes);

export const progressOptionsValidator = Joi.number().valid([25, 50, 75, 100]);

export const progressNoteSchemaValidator = Joi.object<IProgressNote>({
  date: Joi.date().required(),
  content: Joi.string().required(),
  trainer: Joi.string(),
  cardio: progressOptionsValidator,
  diet: progressOptionsValidator,
  workouts: progressOptionsValidator,
});
