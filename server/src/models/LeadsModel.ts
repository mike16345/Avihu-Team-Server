import { Schema, model } from "mongoose";
import { ILead } from "../interfaces/ILead";

const leadsSchema = new Schema<ILead>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 256,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 64,
    },
    deviceId: {
      type: String,
      trim: true,
      maxlength: 128,
    },
    ip: {
      type: String,
      trim: true,
      maxlength: 64,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

leadsSchema.index({ email: 1, createdAt: -1 });

export const LeadsModel = model<ILead>("leads", leadsSchema);
