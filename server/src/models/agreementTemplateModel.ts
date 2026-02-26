import { Schema, model } from "mongoose";
import Joi from "joi";
import {  IAgreementTemplate } from "../interfaces/IAgreement";
import { FormQuestionSchema, formQuestionValidator } from "./formPresetModel";

const agreementTemplateSchema = new Schema<IAgreementTemplate>({
  groupId: { type: String, required: false },
  agreementId: { type: String, required: true },
  version: { type: Number, required: true },
  active: { type: Boolean, default: false },
  templatePdfS3Key: { type: String, required: true },
  questions: { type: [FormQuestionSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
});

agreementTemplateSchema.index({ agreementId: 1, groupId: 1, version: 1 }, { unique: true });
agreementTemplateSchema.index({ agreementId: 1, groupId: 1, active: 1 });

export const AgreementTemplateModel = model("agreementTemplates", agreementTemplateSchema);

export const AgreementTemplateActivationSchema = Joi.object({
  agreementId: Joi.string().required(),
  version: Joi.number().integer().min(1).required(),
  groupId: Joi.string().optional(),
  questions: Joi.array().items(formQuestionValidator).min(0).required(),
  adminId: Joi.string().optional(),
});

export const AgreementTemplateUploadSchema = Joi.object({
  agreementId: Joi.string().optional().allow(""),
  groupId: Joi.string().optional(),
  contentType: Joi.string().valid("application/pdf").required(),
  adminId: Joi.string().optional(),
});
