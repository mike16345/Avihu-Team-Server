import { APIGatewayEvent } from "aws-lambda";
import Joi from "joi";
import { validateBody } from "../utils/utils";
import {
  AgreementTemplateActivationSchema,
  AgreementTemplateUploadSchema,
} from "../models/agreementTemplateModel";

const AnswerValueSchema = Joi.alternatives().try(
  Joi.string(),
  Joi.number(),
  Joi.boolean(),
  Joi.array().items(Joi.string()),
  Joi.allow(null)
);

const AgreementAnswerSchema = Joi.object({
  questionId: Joi.string().required(),
  value: AnswerValueSchema.required(),
});

const AgreementSignSchema = Joi.object({
  agreementId: Joi.string().required(),
  agreementVersion: Joi.number().integer().min(1).required(),
  answers: Joi.array().items(AgreementAnswerSchema).required(),
  signaturePngBase64: Joi.string().required(),
  userId: Joi.string().required(),
  groupId: Joi.string().optional(),
  userDisplayName: Joi.string().optional(),
});

export const validateAgreementSign = (event: APIGatewayEvent) => {
  return validateBody(event, AgreementSignSchema);
};

export const validateAgreementTemplateActivation = (event: APIGatewayEvent) => {
  return validateBody(event, AgreementTemplateActivationSchema);
};

export const validateAgreementTemplateUpload = (event: APIGatewayEvent) => {
  return validateBody(event, AgreementTemplateUploadSchema);
};
