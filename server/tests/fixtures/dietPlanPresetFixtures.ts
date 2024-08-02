// fixtures/dietPlanPresetFixtures.ts
export const validDietItem = {
  quantity: 100,
  unit: "grams",
  customInstructions: [
    { item: "chicken", quantity: 50 },
    { item: "rice", quantity: 50 },
  ],
};

export const validMeal = {
  totalProtein: validDietItem,
  totalCarbs: validDietItem,
  totalFats: validDietItem,
  totalVeggies: validDietItem,
};

export const validDietPlanPreset = {
  name: "Preset 1",
  meals: [validMeal],
  totalCalories: 2000,
};

export const invalidDietItem = {
  quantity: -100,
  unit: "liters", // invalid unit
  customInstructions: [{ item: "chicken", quantity: 50 }],
};

export const invalidMeal = {
  totalProtein: invalidDietItem,
  totalCarbs: validDietItem,
};

export const invalidDietPlanPreset = {
  name: "",
  meals: [invalidMeal],
};
