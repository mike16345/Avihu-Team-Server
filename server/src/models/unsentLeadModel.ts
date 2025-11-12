import { Schema, model } from "mongoose";
import { IUnsentLead } from "../interfaces/IUnsentLead";

const unsentLeadSchema = new Schema<IUnsentLead>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
    },
    source: {
      type: String,
    },
    deviceId: {
      type: String,
    },
    errorMessage: {
      type: String,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "unsentleads",
  }
);

export const UnsentLeadModel = model<IUnsentLead>("unsentleads", unsentLeadSchema);
