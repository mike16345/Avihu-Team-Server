import { Schema, model } from "mongoose";
import Joi from "joi";
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

const leadBaseSchema = Joi.object({
  fullName: Joi.string().trim().max(120),
  email: Joi.string().trim().lowercase().email().max(256),
  phone: Joi.string().trim().max(64),
  deviceId: Joi.string().trim().max(128),
  registeredAt: Joi.date(),
}).prefs({ abortEarly: false, stripUnknown: true });

export const LeadCreateSchema = leadBaseSchema.fork(
  ["fullName", "email"],
  (schema) => schema.required()
);

export const LeadUpdateSchema = leadBaseSchema
  .min(1)
  .messages({
    "object.min": "Invalid payload",
  });
