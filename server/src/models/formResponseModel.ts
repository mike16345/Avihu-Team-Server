import { Schema, model } from "mongoose";
import Joi from "joi";
import { IFormResponse } from "../interfaces/IFormResponse";

const FormResponseQuestionSchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: Schema.Types.Mixed,
    },
  },
  { _id: false }
);

const FormResponseSectionSchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    questions: {
      type: [FormResponseQuestionSchema],
      required: true,
    },
  },
  { _id: false }
);

export const FormResponseSchema = new Schema<IFormResponse>({
  formId: {
    type: Schema.Types.ObjectId,
    ref: "forms",
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  submittedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  formTitle: {
    type: String,
  },
  formType: {
    type: String,
  },
  sections: {
    type: [FormResponseSectionSchema],
    required: true,
  },
});

FormResponseSchema.index({ userId: 1, formId: 1, submittedAt: -1 });

export const FormResponseModel = model<IFormResponse>("formResponses", FormResponseSchema);

export const formResponseQuestionValidator = Joi.object({
  _id: Joi.string().required(),
  type: Joi.string().required(),
  question: Joi.string().required(),
  answer: Joi.any().optional(),
});

export const formResponseSectionValidator = Joi.object({
  _id: Joi.string().required(),
  title: Joi.string().required(),
  questions: Joi.array().items(formResponseQuestionValidator).min(1).required(),
});

export const formResponseValidator = Joi.object({
  formId: Joi.string().required(),
  userId: Joi.string().required(),
  submittedAt: Joi.date().optional(),
  formTitle: Joi.string().optional().allow(""),
  formType: Joi.string().optional().allow(""),
  sections: Joi.array().items(formResponseSectionValidator).min(1).required(),
  createdAt: Joi.date().optional(),
  updatedAt: Joi.date().optional(),
});
