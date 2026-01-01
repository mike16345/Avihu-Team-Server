import { Schema, model } from "mongoose";
import Joi from "joi";
import { IForm } from "../interfaces/IForm";

const QUESTION_TYPES = [
  "text",
  "textarea",
  "radio",
  "range",
  "file-upload",
  "checkboxes",
  "drop-down",
] as const;

const OPTION_TYPES = ["radio", "drop-down", "checkboxes", "range"] as const;

const FormQuestionSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: QUESTION_TYPES,
    },
    question: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    options: {
      type: [String],
      default: undefined, // prevents empty array for non-option questions
    },
    required: {
      type: Boolean,
      required: true,
    },
  },
  { _id: true }
);

const FormSectionSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    questions: {
      type: [FormQuestionSchema],
      required: true,
    },
  },
  { _id: true }
);

export const FormSchema = new Schema<IForm>(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["onboarding", "monthly", "general"],
    },
    showOn: {
      type: Date,
    },
    repeatMonthly: {
      type: Boolean,
      required: true,
      default: false,
    },
    sections: {
      type: [FormSectionSchema],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const FormModel = model<IForm>("forms", FormSchema);

export const formQuestionValidator = Joi.object({
  type: Joi.string()
    .valid(...QUESTION_TYPES)
    .required(),
  question: Joi.string().required(),
  description: Joi.string().optional(),
  required: Joi.boolean().required(),

  options: Joi.when("type", {
    is: Joi.valid(...OPTION_TYPES),
    then: Joi.array().items(Joi.string()).min(1).required(),
    otherwise: Joi.array().length(0).optional(),
  }),
});

export const formSectionValidator = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional().allow(""),
  questions: Joi.array().items(formQuestionValidator).min(1).required(),
});

export const formValidator = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().valid("onboarding", "monthly", "general").required(),
  showOn: Joi.date().optional(),
  repeatMonthly: Joi.boolean().required(),
  sections: Joi.array().items(formSectionValidator).min(1).required(),
  createdAt: Joi.date().optional(),
  updatedAt: Joi.date().optional(),
});
