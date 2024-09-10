export interface IDietPlan {
  userId: string;
  meals: IMeal[];
  totalCalories?: number;
  freeCalories?: number;
  customInstructions?: string;
}

export interface ICustomItemInstructions {
  item: string;
  quantity: number;
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
