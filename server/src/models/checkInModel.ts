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
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 60 * 60 * 1000),
    required: true,
  },
});

export const CheckInModel = model(`checkIns`, checkInSchema);
