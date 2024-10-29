export interface IDietPlan {
  userId: string;
  meals: IMeal[];
  totalCalories?: number;
  freeCalories?: number;
  fatsPerDay?: number;
  veggiesPerDay?: number;
  customInstructions?: string;
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
  unit: DietItemUnit;
  customItems?: ICustomItemInstructions[];
}

export interface IMeal {
  totalProtein: IDietItem;
  totalCarbs: IDietItem;
}

export interface IDietPlanPreset extends Omit<IDietPlan, "userId"> {
  name: string;
}

export type DietItemUnit = "grams" | "spoons";
