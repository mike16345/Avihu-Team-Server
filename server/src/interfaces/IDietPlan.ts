import { ObjectId } from "mongoose";

export interface IDietPlan {
  version?: 1;
  userId: string;
  meals: IMeal[];
  totalCalories?: number;
  freeCalories?: number;
  fatsPerDay?: number;
  supplements: string[];
  veggiesPerDay?: number;
  customInstructions?: string[];
}

export interface ICustomItemInstructions {
  name: string;
  dietaryType: string[];
  foodGroup: string;
  oneServing: {
    grams: number;
    spoons: number;
  };
}

export interface IDietItem {
  quantity: number;
  customItems?: ObjectId[];
  extraItems?: string[];
}

export interface IMeal {
  totalProtein: IDietItem;
  totalCarbs: IDietItem;
  totalFats: IDietItem;
  totalVeggies: IDietItem;
}

/**
 * Optional trainer-tagged meta on a diet-plan preset. Surfaced in the
 * admin panel for filtering (goal, calorie bucket, dietary
 * restrictions, builder). All fields are optional — older docs without
 * any tagging keep working unchanged.
 */
export type DietGoal = "cutting" | "mass";
export type DietaryRestriction =
  | "lactose-free"
  | "vegetarian"
  | "vegan"
  | "no-fish"
  | "no-meat"
  | "gluten-free";

export interface IDietPlanMeta {
  goal?: DietGoal;
  calories?: number;
  proteinServings?: number;
  carbServings?: number;
  fatServings?: number;
  dietaryRestrictions?: DietaryRestriction[];
  /** Sub-trainer (or main-trainer) id of whoever built this menu. */
  builtByTrainerId?: string;
}

export interface IDietPlanPreset extends Omit<IDietPlan, "userId">, IDietPlanMeta {
  name: string;
  normalizedName?: string;
}

export type DietItemUnit = "grams" | "spoons";
