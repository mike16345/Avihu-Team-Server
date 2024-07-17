// tests/fixtures/dietPlanFixtures.ts
import { IDietItem, IMeal, IDietPlan } from "../../src/interfaces/IDietPlan";

export const validDietItem: IDietItem = {
  quantity: 100,
  unit: "grams",
  customInstructions: [
    {
      item: "Chicken",
      quantity: 100,
    },
  ],
};

export const invalidDietItem: IDietItem = {
  quantity: -100,
  unit: "invalidUnit" as "grams",
  customInstructions: [
    {
      item: "Chicken",
      quantity: -100,
    },
  ],
};

export const validMeal: IMeal = {
  totalProtein: validDietItem,
  totalCarbs: validDietItem,
};

export const invalidMeal: IMeal = {
  totalProtein: invalidDietItem,
  totalCarbs: invalidDietItem,
};

export const validDietPlan: IDietPlan = {
  userId: "12345",
  meals: [validMeal],
  totalCalories: 2000,
};

export const invalidDietPlan: IDietPlan = {
  userId: "",
  meals: [invalidMeal],
};
