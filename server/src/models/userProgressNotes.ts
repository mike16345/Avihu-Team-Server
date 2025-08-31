import { model, Schema } from "mongoose";
import { IProgressNote, IUserProgressNotes } from "../interfaces/userProgress";
import Joi from "joi";

const progressOptions = {
  type: Number,
  enum: [25, 50, 75, 100],
};

export const progressNote = new Schema<IProgressNote>({
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

export const userProgressNotes = new Schema<IUserProgressNotes>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  progressNotes: [progressNote],
});

export const UserProgressNote = model(`userProgressNote`, userProgressNotes);

export const progressOptionsValidator = Joi.number().valid([25, 50, 75, 100]);

export const progressNoteSchemaValidator = Joi.object<IProgressNote>({
  date: Joi.date().required(),
  content: Joi.string().required(),
  trainer: Joi.string(),
  cardio: progressOptionsValidator,
  diet: progressOptionsValidator,
  workouts: progressOptionsValidator,
});
