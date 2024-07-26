import { ObjectId } from "mongodb";

export interface IDietPlan {
  userId: string;
  meals: IMeal[];
  totalCalories?: number;
}

export interface ICustomItemInstructions {
  item: string;
  quantity: number;
}

export interface IDietItem {
  quantity: number;
  unit: DietItemUnit;
  customInstructions?: ICustomItemInstructions[];
}

export interface IMeal {
  totalProtein: IDietItem;
  totalCarbs: IDietItem;
  totalFats?: IDietItem;
  totalVeggies?: IDietItem;
}

export type DietItemUnit = "grams" | "spoons";
