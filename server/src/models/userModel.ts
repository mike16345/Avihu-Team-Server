import { IUser } from "../interfaces/IUser";

import { Schema, model } from "mongoose";
import Joi from "joi";

export const USER_ROLES = ["admin", "user", "trainer", "subTrainer"] as const;
export const USER_ONBOARDING_STEPS = ["form", "agreement", "completed"] as const;
export const USER_ACCOUNT_STATUSES = ["active", "user", "disabled", "frozen"] as const;

const userSchema = new Schema<IUser>({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
    required: false,
  },
  profileImage: {
    type: String,
    required: false,
    unique: true,
  },
  dietaryType: {
    type: [String],
    required: false,
  },

  hasAccess: {
    type: Boolean,
    required: false,
    default: true,
  },
  // accountStatus — 4-state status for trainee categorization.
  // - "active":   פעיל   (paying client, has access)
  // - "user":     משתמש  (registered user, has access — e.g. trial / free tier)
  // - "disabled": כבוי   (no access to the app)
  // - "frozen":   הקפאה  (temporary pause: keeps access, hidden
  //                       from attention lists; freeze snapshot
  //                       fields capture how much coaching time
  //                       was left at pause).
  // hasAccess is auto-derived: accountStatus !== "disabled".
  accountStatus: {
    type: String,
    enum: USER_ACCOUNT_STATUSES,
    required: false,
    default: "active",
  },
  // Freeze snapshot — populated when accountStatus is set to "frozen".
  // Cleared by the admin app when the trainee comes off freeze.
  frozenAt: {
    type: Date,
    required: false,
  },
  frozenDaysRemaining: {
    type: Number,
    required: false,
    min: 0,
  },
  dateJoined: {
    type: Date,
    default: Date.now,
  },
  dateFinished: {
    type: Date,
    required: false,
  },
  planType: {
    type: String,
    required: false,
  },
  remindIn: {
    type: Number,
    required: false,
  },
  checkInAt: {
    type: Number,
    required: false,
  },
  isChecked: {
    type: Boolean,
    default: false,
    required: false,
  },
  imagesUploaded: {
    type: Boolean,
    default: false,
    required: false,
  },
  role: {
    type: String,
    enum: USER_ROLES,
    default: "user",
  },
  onboardingStep: {
    type: String,
    enum: USER_ONBOARDING_STEPS,
    default: "form",
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  trainerId: {
    type: Schema.Types.ObjectId,
    ref: "trainers",
    required: false,
  },
  subTrainerId: {
    type: Schema.Types.ObjectId,
    ref: "subTrainers",
    required: false,
  },
});

export const User = model("users", userSchema);

const phoneRegex = /^\+?[0-9\s\-().]{7,20}$/;

export const UserSchemaValidation = Joi.object({
  firstName: Joi.string().min(2).max(25),
  lastName: Joi.string().min(2).max(25),
  email: Joi.string().min(5).max(30).email(),
  phone: Joi.string().pattern(phoneRegex),
  isDeleted: Joi.boolean().optional(),
  dietaryType: Joi.array().items(Joi.string()),
  dateFinished: Joi.date(),
  planType: Joi.string(),
  remindIn: Joi.number().min(259200).max(2678400),
  checkInAt: Joi.number(),
  isChecked: Joi.boolean(),
  hasAccess: Joi.boolean(),
  accountStatus: Joi.string()
    .valid(...USER_ACCOUNT_STATUSES)
    .optional(),
  // Freeze snapshot — populated only when accountStatus = "frozen".
  // Cleared back to undefined when the trainee comes off freeze.
  frozenAt: Joi.date().allow(null).optional(),
  frozenDaysRemaining: Joi.number().min(0).allow(null).optional(),
  imagesUploaded: Joi.boolean(),
  profileImage: Joi.string().optional(),
  isAdmin: Joi.boolean().optional(),
  role: Joi.string()
    .valid(...USER_ROLES)
    .default("user"),
  onboardingStep: Joi.string()
    .valid(...USER_ONBOARDING_STEPS)
    .default("form"),
  trainerId: Joi.string().optional(),
  subTrainerId: Joi.string().optional(),
});
