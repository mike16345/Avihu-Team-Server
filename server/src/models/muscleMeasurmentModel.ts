import { Schema, model } from "mongoose";
import { IMuscleMeasurement, IUserMuscleMeasurements } from "../interfaces/IMuscleMeasurment";

const MuscleMeasurementSchema = new Schema<IMuscleMeasurement>({
  date: { type: String, required: true },
  chest: { type: Number, required: true },
  arm: { type: Number, required: true },
  calf: { type: Number, required: true },
  glutes: { type: Number, required: true },
  thigh: { type: Number, required: true },
  waist: { type: Number, required: true },
});

const MuscleMeasurementsSchema = new Schema<IUserMuscleMeasurements>({
  userId: { type: String, required: true, unique: true },
  measurements: { type: [MuscleMeasurementSchema], default: [] },
});

const MuscleMeasurementsModel = model<IUserMuscleMeasurements>(
  "MuscleMeasurements",
  MuscleMeasurementsSchema
);

export default MuscleMeasurementsModel;
