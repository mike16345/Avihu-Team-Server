import { Schema, model } from "mongoose";
import { IMuscleMeasurement, IUserMuscleMeasurements } from "../interfaces/IMuscleMeasurment";
import { IModel } from "../interfaces/IModel";

const MuscleMeasurementSchema = new Schema<IMuscleMeasurement>({
  date: { type: String, required: true },
  chest: { type: Number, required: true },
  arm: { type: Number, required: true },
  calf: { type: Number, required: true },
  glutes: { type: Number, required: true },
  thigh: { type: Number, required: true },
  waist: { type: Number, required: true },
});

const MuscleMeasurementsSchema = new Schema<IUserMuscleMeasurements & IModel>({
  userId: { type: String, required: true, unique: true },
  trainerId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "trainers",
  },
  measurements: { type: [MuscleMeasurementSchema], default: [] },
});

export const MuscleMeasurements = model<IUserMuscleMeasurements & IModel>(
  "MuscleMeasurements",
  MuscleMeasurementsSchema
);
