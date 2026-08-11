import Joi from "joi";
import { model, Schema } from "mongoose";
import {
  DIET_V2_DIET_TAGS,
  DIET_V2_MEAL_CATEGORIES,
  DIET_V2_TEMPLATE_GENDERS,
  DIET_V2_TEMPLATE_GOALS,
  DietV2Category,
  DietV2Meal,
  DietV2MealMacros,
  DietV2PlanItem,
  IDietPlanPresetV2Document,
  IDietPlanV2Document,
} from "../interfaces/IDietPlanV2";
import { validateDietV2Categories } from "../utils/dietPlanV2";
import { DIET_PLANS_COLLECTION } from "./dietPlanModel";
import { DIET_PLAN_PRESETS_COLLECTION } from "./dietPlanPresetModel";

const nonBlankString = {
  type: String,
  required: true,
  validate: {
    validator: (value: string) => value.trim().length > 0,
    message: "Value must not be blank",
  },
} as const;

const finiteNonnegativeNumber = {
  type: Number,
  required: true,
  min: 0,
  validate: {
    validator: Number.isFinite,
    message: "Value must be finite",
  },
} as const;

export const dietV2PlanItemSchema = new Schema<DietV2PlanItem>(
  {
    name: nonBlankString,
    catalogItemId: { type: Schema.Types.ObjectId, required: false },
  },
  { _id: false, strict: "throw" }
);

export const dietV2CategorySchema = new Schema<DietV2Category>(
  {
    category: {
      type: String,
      enum: DIET_V2_MEAL_CATEGORIES,
      required: true,
    },
    items: { type: [dietV2PlanItemSchema], required: true, default: [] },
  },
  { _id: false, strict: "throw" }
);

export const dietV2MealMacrosSchema = new Schema<DietV2MealMacros>(
  {
    calories: finiteNonnegativeNumber,
    protein: finiteNonnegativeNumber,
    carbs: finiteNonnegativeNumber,
    fat: finiteNonnegativeNumber,
  },
  { _id: false, strict: "throw" }
);

export const dietV2FreeCaloriesSchema = new Schema(
  {
    calories: finiteNonnegativeNumber,
    description: nonBlankString,
  },
  { _id: false, strict: "throw" }
);

const categoriesValidators = [
  {
    validator: (categories: DietV2Category[]) => {
      try {
        validateDietV2Categories(categories);
        return true;
      } catch {
        return false;
      }
    },
    message: "Meal categories contain duplicate categories or item names",
  },
];

export const dietV2MealSchema = new Schema<DietV2Meal>(
  {
    id: nonBlankString,
    name: nonBlankString,
    categories: {
      type: [dietV2CategorySchema],
      required: true,
      validate: categoriesValidators,
    },
    macros: { type: dietV2MealMacrosSchema, required: true },
    freeCalories: { type: dietV2FreeCaloriesSchema, required: false },
    supplements: { type: [String], required: false },
  },
  { _id: false, strict: "throw" }
);

const dietPlanV2ContentDefinition = {
  version: { type: Number, enum: [2], required: true, default: 2 },
  meals: {
    type: [dietV2MealSchema],
    required: true,
    validate: {
      validator: (meals: DietV2Meal[]) => meals.length > 0,
      message: "Diet Plan must contain at least one meal",
    },
  },
  highlights: { type: String, required: true },
} as const;

export const dietPlanV2Schema = new Schema<IDietPlanV2Document>(
  {
    userId: { type: String, required: true, index: true },
    trainerId: { type: Schema.Types.ObjectId, required: true, ref: "trainers", index: true },
    ...dietPlanV2ContentDefinition,
  },
  {
    timestamps: true,
    strict: "throw",
    collection: DIET_PLANS_COLLECTION,
  }
);

export const dietPlanPresetV2Schema = new Schema<IDietPlanPresetV2Document>(
  {
    name: nonBlankString,
    normalizedName: nonBlankString,
    trainerId: { type: Schema.Types.ObjectId, required: true, ref: "trainers", index: true },
    builtByTrainerId: { type: Schema.Types.ObjectId, required: true, ref: "users" },
    goal: { type: String, enum: DIET_V2_TEMPLATE_GOALS, required: false },
    targetGender: { type: String, enum: DIET_V2_TEMPLATE_GENDERS, required: false },
    dietTags: { type: [String], enum: DIET_V2_DIET_TAGS, required: false },
    ...dietPlanV2ContentDefinition,
  },
  {
    timestamps: true,
    strict: "throw",
    collection: DIET_PLAN_PRESETS_COLLECTION,
  }
);

dietPlanPresetV2Schema.index(
  { trainerId: 1, version: 1, normalizedName: 1 },
  { unique: true }
);

export const DietPlanV2Model = model<IDietPlanV2Document>(
  "dietPlansV2",
  dietPlanV2Schema,
  DIET_PLANS_COLLECTION
);

export const DietPlanPresetV2Model = model<IDietPlanPresetV2Document>(
  "dietPlanPresetsV2",
  dietPlanPresetV2Schema,
  DIET_PLAN_PRESETS_COLLECTION
);

const dietV2PlanItemValidationSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
  catalogItemId: Joi.string().hex().length(24).optional(),
});

const dietV2CategoryValidationSchema = Joi.object({
  category: Joi.string()
    .valid(...DIET_V2_MEAL_CATEGORIES)
    .required(),
  items: Joi.array().items(dietV2PlanItemValidationSchema).required(),
});

const dietV2MealMacrosValidationSchema = Joi.object({
  calories: Joi.number().min(0).required(),
  protein: Joi.number().min(0).required(),
  carbs: Joi.number().min(0).required(),
  fat: Joi.number().min(0).required(),
});

const dietV2FreeCaloriesValidationSchema = Joi.object({
  calories: Joi.number().min(0).required(),
  description: Joi.string().trim().min(1).required(),
});

const dietV2CategoriesValidationSchema = Joi.array()
  .items(dietV2CategoryValidationSchema)
  .required()
  .custom((categories: DietV2Category[]) => {
    validateDietV2Categories(categories);
    return categories;
  });

const dietV2MealValidationSchema = Joi.object({
  id: Joi.string().trim().min(1).required(),
  name: Joi.string().trim().min(1).required(),
  categories: dietV2CategoriesValidationSchema,
  macros: dietV2MealMacrosValidationSchema.required(),
  freeCalories: dietV2FreeCaloriesValidationSchema.optional(),
  supplements: Joi.array().items(Joi.string()).optional(),
});

const dietPlanV2ContentValidationFields = {
  version: Joi.number().valid(2).required(),
  meals: Joi.array().items(dietV2MealValidationSchema).min(1).required(),
  highlights: Joi.string().allow("").required(),
};

export const DietPlanV2SchemaValidation = Joi.object({
  userId: Joi.string().required(),
  ...dietPlanV2ContentValidationFields,
}).prefs({ abortEarly: false, stripUnknown: true });

export const DietPlanPresetV2SchemaValidation = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  goal: Joi.string()
    .valid(...DIET_V2_TEMPLATE_GOALS)
    .optional(),
  targetGender: Joi.string()
    .valid(...DIET_V2_TEMPLATE_GENDERS)
    .optional(),
  dietTags: Joi.array()
    .items(Joi.string().valid(...DIET_V2_DIET_TAGS))
    .optional(),
  ...dietPlanV2ContentValidationFields,
}).prefs({ abortEarly: false, stripUnknown: true });
