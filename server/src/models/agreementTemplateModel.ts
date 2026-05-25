import { Schema, model } from "mongoose";
import Joi from "joi";
import { IAgreementTemplate } from "../interfaces/IAgreement";
import { FormQuestionSchema, formQuestionValidator } from "./formPresetModel";
import { IModel } from "../interfaces/IModel";

const agreementTemplateSchema = new Schema<IAgreementTemplate & IModel>({
  groupId: { type: String, required: false },
  agreementId: { type: String, required: true },
  version: { type: Number, required: true },
  active: { type: Boolean, default: true },
  templatePdfS3Key: { type: String, required: true },
  questions: { type: [FormQuestionSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  trainerId: { type: Schema.Types.ObjectId, required: true },
});

agreementTemplateSchema.index(
  { agreementId: 1, groupId: 1, version: 1, trainerId: 1 },
  { unique: true }
);
agreementTemplateSchema.index({ agreementId: 1, groupId: 1, active: 1 });

export const AgreementTemplateModel = model("agreementTemplates", agreementTemplateSchema);

export const AgreementTemplateActivationSchema = Joi.object({
  version: Joi.number().integer().min(1).required(),
  groupId: Joi.string().optional(),
  questions: Joi.array().items(formQuestionValidator).min(0).required(),
  adminId: Joi.string().optional(),
});

export const AgreementTemplateUploadSchema = Joi.object({
  groupId: Joi.string().optional(),
  contentType: Joi.string().valid("application/pdf").required(),
  adminId: Joi.string().optional(),
});
