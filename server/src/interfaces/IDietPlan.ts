import { ObjectId } from "mongodb";

export interface ICustomItemInstructions {
  item: string;
  quantity: number;
  unit: "grams" | "spoons";
}

export interface ICustomProteinInstructions extends ICustomItemInstructions {}
export interface ICustomCarbsInstructions extends ICustomItemInstructions {}

export interface IMeal {
  totalProtein: number;
  totalCarbs: number;
  totalFats?: number;
  totalVeggies?: number;
  customProteinInstructions?: ICustomProteinInstructions[];
  customCarbsInstructions?: ICustomCarbsInstructions;
  customVeggiesInstructions?: ICustomItemInstructions[];
  customFatsInstructions?: ICustomItemInstructions[];
}

export interface IDietPlan {
  id: ObjectId;
  meals: IMeal[];
  totalCalories?: number;
}
