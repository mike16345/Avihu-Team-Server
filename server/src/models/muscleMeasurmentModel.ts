import mongoose, { Schema, model } from "mongoose";
import { IMuscleMeasurement, IUserMuscleMeasurements } from "../interfaces/IMuscleMeasurment";

const MuscleMeasurementSchema = new Schema<IMuscleMeasurement>({
  date: { type: String, required: true }, // or Date
  chest: { type: Number, required: true },
  bicep: { type: Number, required: true },
  shoulder: { type: Number, required: true },
  back: { type: Number, required: true },
  leg: { type: Number, required: true },
});

const MuscleMeasurementsSchema = new Schema<IUserMuscleMeasurements>({
  userId: { type: String, required: true, unique: true },
  measurements: { type: [MuscleMeasurementSchema], default: [] },
});

const MuscleMeasurementsModel = model<MuscleMeasurementsDocument>(
  "MuscleMeasurements",
  MuscleMeasurementsSchema
);

export default MuscleMeasurementsModel;
