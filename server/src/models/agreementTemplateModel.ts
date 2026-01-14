import { Schema, model } from "mongoose";
import Joi from "joi";
import { IAgreementQuestionDefinition, IAgreementTemplate } from "../interfaces/IAgreement";

const questionSchema = new Schema<IAgreementQuestionDefinition>({
  questionId: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, required: false },
  required: { type: Boolean, default: false },
  options: { type: [String], required: false },
});

const agreementTemplateSchema = new Schema<IAgreementTemplate>({
  groupId: { type: String, required: false },
  agreementId: { type: String, required: true },
  version: { type: Number, required: true },
  active: { type: Boolean, default: false },
  templatePdfS3Key: { type: String, required: true },
  questions: { type: [questionSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
});

agreementTemplateSchema.index({ agreementId: 1, groupId: 1, version: 1 }, { unique: true });
agreementTemplateSchema.index({ agreementId: 1, groupId: 1, active: 1 });

export const AgreementTemplateModel = model("agreementTemplates", agreementTemplateSchema);

export const AgreementQuestionValidationSchema = Joi.object({
  questionId: Joi.string().required(),
  label: Joi.string().required(),
  type: Joi.string().optional(),
  required: Joi.boolean().optional(),
  options: Joi.array().items(Joi.string()).optional(),
});

export const AgreementTemplateActivationSchema = Joi.object({
  agreementId: Joi.string().required(),
  version: Joi.number().integer().min(1).required(),
  groupId: Joi.string().optional(),
  questions: Joi.array().items(AgreementQuestionValidationSchema).min(0).required(),
  adminId: Joi.string().optional(),
});

export const AgreementTemplateUploadSchema = Joi.object({
  agreementId: Joi.string().required(),
  groupId: Joi.string().optional(),
  contentType: Joi.string().valid("application/pdf").required(),
  adminId: Joi.string().optional(),
});
