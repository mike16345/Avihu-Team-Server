import { Schema, model } from "mongoose";

const checkInSchema = new Schema({
  _id: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  isChecked: {
    type: Boolean,
    default: false,
    required: true,
  },
  remindIn: {
    type: Number,
    default: 120,
    required: true,
  },
  lastUpdatedAt: {
    type: Date,
    required: true,
    default: new Date(),
  },
});

export const CheckInModel = model(`checkIns`, checkInSchema);
