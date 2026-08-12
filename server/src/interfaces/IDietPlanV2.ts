import { Types } from "mongoose";

export const DIET_V2_MEAL_CATEGORIES = [
  "protein",
  "carbs",
  "fat",
  "vegetables",
  "addon",
] as const;
export const DIET_V2_CATALOG_CATEGORIES = [
  ...DIET_V2_MEAL_CATEGORIES,
  "freeCalories",
] as const;
export const DIET_V2_TEMPLATE_GOALS = ["cutting", "maintain", "bulking"] as const;
export const DIET_V2_TEMPLATE_GENDERS = ["women", "men", "both"] as const;
export const DIET_V2_DIET_TAGS = [
  "vegan",
  "vegetarian",
  "no_dairy",
  "no_fish",
  "no_gluten",
  "no_lactose",
  "no_meat",
  "no_nuts",
  "kosher",
] as const;

export type DietV2MealCategory = (typeof DIET_V2_MEAL_CATEGORIES)[number];
export type DietV2CatalogCategory = (typeof DIET_V2_CATALOG_CATEGORIES)[number];
export type DietV2TemplateGoal = (typeof DIET_V2_TEMPLATE_GOALS)[number];
export type DietV2TemplateGender = (typeof DIET_V2_TEMPLATE_GENDERS)[number];
export type DietV2DietTag = (typeof DIET_V2_DIET_TAGS)[number];

export interface DietV2PlanItem {
  name: string;
  catalogItemId?: Types.ObjectId | string;
}

export interface DietV2Category {
  category: DietV2MealCategory;
  items: DietV2PlanItem[];
}

export interface DietV2MealMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DietV2FreeCalories {
  calories: number;
  description: string;
}

export interface DietV2Meal {
  _id?: Types.ObjectId | string;
  name: string;
  categories: DietV2Category[];
  macros: DietV2MealMacros;
  freeCalories?: DietV2FreeCalories;
  supplements?: string[];
}

export interface IDietPlanV2Content {
  version: 2;
  meals: DietV2Meal[];
  highlights: string;
}

export interface IDietPlanV2SaveRequest extends IDietPlanV2Content {
  userId: string;
}

export interface IDietPlanV2Document extends IDietPlanV2SaveRequest {
  _id?: Types.ObjectId;
  trainerId: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IDietPlanPresetV2SaveRequest extends IDietPlanV2Content {
  name: string;
  goal?: DietV2TemplateGoal;
  targetGender?: DietV2TemplateGender;
  dietTags?: DietV2DietTag[];
}

export interface IDietPlanPresetV2Document extends IDietPlanPresetV2SaveRequest {
  _id?: Types.ObjectId;
  trainerId: Types.ObjectId;
  builtByTrainerId: Types.ObjectId;
  normalizedName: string;
  createdAt?: Date;
  updatedAt?: Date;
}
