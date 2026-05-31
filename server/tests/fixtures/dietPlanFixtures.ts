// tests/fixtures/dietPlanFixtures.ts
export const validDietItem = {
  quantity: 100,
  customItems: ["507f1f77bcf86cd799439011"],
  extraItems: ["Chicken"],
};

export const invalidDietItem = {
  extraItems: ["Missing quantity"],
};

export const validMeal = {
  totalProtein: validDietItem,
  totalCarbs: validDietItem,
  totalFats: validDietItem,
  totalVeggies: validDietItem,
};

export const invalidMeal = {
  totalProtein: invalidDietItem,
  totalCarbs: invalidDietItem,
  totalFats: validDietItem,
  totalVeggies: validDietItem,
};

export const validDietPlan = {
  userId: "12345",
  meals: [validMeal],
  supplements: [],
  totalCalories: 2000,
};

export const invalidDietPlan = {
  meals: [invalidMeal],
  supplements: [],
};
