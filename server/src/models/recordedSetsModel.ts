import { model, Schema, Document } from "mongoose";
import { IMuscleGroupRecordedSets, IRecordedSet } from "../interfaces/ISet";
import Joi from "joi";

interface IMuscleGroupRecordedSetsDocument extends IMuscleGroupRecordedSets, Document {}

const recordedSetSchema = new Schema<IRecordedSet>({
  plan: { type: String, required: true },
  exercise: { type: String, required: true },
  setNumber: { type: Number, required: true },
  weight: { type: Number, required: true },
  repsDone: { type: Number, required: true },
  note: { type: String },
  date: { type: Date, default: Date.now },
  sessionId: { type: String, required: true },
});

const exerciseRecordedSetsSchema = new Schema({
  exercise: { type: String, required: true },
  recordedSets: [recordedSetSchema],
});

const muscleGroupRecordedSetsSchema = new Schema<IMuscleGroupRecordedSetsDocument>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  muscleGroup: { type: String, required: true },
  recordedSets: { type: Object, of: [exerciseRecordedSetsSchema], default: {} },
});

export const RecordedSet = model<IRecordedSet>("RecordedSet", recordedSetSchema);

export const MuscleGroupRecordedSets = model<IMuscleGroupRecordedSetsDocument>(
  "RecordedSets",
  muscleGroupRecordedSetsSchema
);

const RecordedSetJoiSchema = Joi.object<IRecordedSet>({
  plan: Joi.string().required(),
  setNumber: Joi.number(),
  weight: Joi.number().required(),
  repsDone: Joi.number().required(),
  note: Joi.string().allow(null, ""),
  sessionId: Joi.string(),
  date: Joi.date().default(() => new Date()),
});

const muscleGroupRecordedSetsJoiSchema = Joi.object<IMuscleGroupRecordedSets>({
  userId: Joi.string().required(),
  muscleGroup: Joi.string().required(),
  recordedSets: Joi.object().pattern(Joi.string(), Joi.array().items(RecordedSetJoiSchema)),
});

export { RecordedSetJoiSchema, muscleGroupRecordedSetsJoiSchema };
