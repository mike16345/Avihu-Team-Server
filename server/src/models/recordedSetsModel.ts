import { model, Schema } from "mongoose";
import { IMuscleGroupRecordedSets, IRecordedSet } from "../interfaces/ISet";
import Joi from "joi";

interface IMuscleGroupRecordedSetsDocument extends IMuscleGroupRecordedSets {}

const recordedSetSchema = new Schema<IRecordedSet>({
  plan: { type: String, required: true },
  exercise: { type: String, required: true },
  setNumber: { type: Number, min: 1, required: true },
  weight: { type: Number, min: 1, required: true },
  repsDone: { type: Number, min: 1, required: true },
  note: { type: String },
  exerciseId: { type: Schema.Types.ObjectId, required: false },
  date: { type: Date, default: Date.now },
  rir: { type: Number, min: 0, required: false },
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

export const MuscleGroupRecordedSets = model("RecordedSets", muscleGroupRecordedSetsSchema);

const RecordedSetJoiSchema = Joi.object<IRecordedSet>({
  plan: Joi.string().required(),
  setNumber: Joi.number(),
  weight: Joi.number().min(1).required(),
  repsDone: Joi.number().min(1).required(),
  note: Joi.string().allow(null, ""),
  exerciseId: Joi.string().optional().allow(null, ""),
  date: Joi.date().default(() => new Date()),
});

const muscleGroupRecordedSetsJoiSchema = Joi.object<IMuscleGroupRecordedSets>({
  userId: Joi.string().required(),
  muscleGroup: Joi.string().required(),
  recordedSets: Joi.object().pattern(Joi.string(), Joi.array().items(RecordedSetJoiSchema)),
});

export { RecordedSetJoiSchema, muscleGroupRecordedSetsJoiSchema };
