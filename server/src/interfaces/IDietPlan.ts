export interface IDietPlan {
  userId: string;
  meals: IMeal[];
  totalCalories?: number;
  freeCalories?: number;
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
  totalFats?: IDietItem;
  totalVeggies?: IDietItem;
}

export interface IDietPlanPreset extends Omit<IDietPlan, "userId"> {
  name: string;
}

export type DietItemUnit = "grams" | "spoons";
