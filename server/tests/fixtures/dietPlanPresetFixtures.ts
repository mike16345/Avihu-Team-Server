export const validDietItem = {
  quantity: 100,
  customItems: ["507f1f77bcf86cd799439011"],
  extraItems: ["chicken", "rice"],
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
  supplements: [],
  totalCalories: 2000,
};

export const invalidDietItem = {
  extraItems: ["missing quantity"],
};

export const invalidMeal = {
  totalProtein: invalidDietItem,
  totalCarbs: validDietItem,
  totalFats: validDietItem,
  totalVeggies: validDietItem,
};

export const invalidDietPlanPreset = {
  meals: [invalidMeal],
};

export const invalidNamedDietPlanPreset = {
  name: "",
  meals: [invalidMeal],
};
