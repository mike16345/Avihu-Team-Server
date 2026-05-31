import { Schema, model } from "mongoose";
import Joi from "joi";
import { ILead } from "../interfaces/ILead";
import { IModel } from "../interfaces/IModel";

const leadsSchema = new Schema<ILead & IModel>(
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
    trainerId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "trainers",
    },
    isContacted: {
      type: Boolean,
      default: false,
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

export const LeadsModel = model<ILead & IModel>("leads", leadsSchema);

const leadBaseSchema = Joi.object({
  fullName: Joi.string().trim().max(120),
  email: Joi.string().trim().lowercase().email().max(256),
  phone: Joi.string().trim().max(64),
  deviceId: Joi.string().trim().max(128),
  isContacted: Joi.boolean().default(false),
  registeredAt: Joi.date(),
}).prefs({ abortEarly: false, stripUnknown: true });

export const LeadCreateSchema = leadBaseSchema.fork(["fullName", "email"], (schema) =>
  schema.required()
);

export const LeadUpdateSchema = Joi.object({
  id: Joi.string().required(),
  isContacted: Joi.boolean().required(),
}).prefs({ abortEarly: false, stripUnknown: true });
