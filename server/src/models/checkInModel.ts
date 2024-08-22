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
    default: 3600,
    required: true,
  },
  lastUpdatedAt: {
    type: Date,
    default: Date.now(),
  },
});

export const CheckInModel = model(`checkIns`, checkInSchema);
