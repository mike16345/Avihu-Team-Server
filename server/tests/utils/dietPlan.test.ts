import { calculateTotalCalories } from "../../src/utils/dietPlan";

describe("calculateTotalCalories", () => {
  test("uses the agreed serving calorie values for all macro groups", () => {
    const totalCalories = calculateTotalCalories(
      [
        {
          totalProtein: { quantity: 2, customItems: [], extraItems: [] },
          totalCarbs: { quantity: 3, customItems: [], extraItems: [] },
          totalFats: { quantity: 1, customItems: [], extraItems: [] },
          totalVeggies: { quantity: 4, customItems: [], extraItems: [] },
        },
      ] as any,
      50
    );

    expect(totalCalories).toBe(2 * 150 + 3 * 120 + 1 * 100 + 4 * 20 + 50);
  });

  test("defaults free calories to zero", () => {
    const totalCalories = calculateTotalCalories(
      [
        {
          totalProtein: { quantity: 1, customItems: [], extraItems: [] },
          totalCarbs: { quantity: 1, customItems: [], extraItems: [] },
          totalFats: { quantity: 1, customItems: [], extraItems: [] },
          totalVeggies: { quantity: 1, customItems: [], extraItems: [] },
        },
      ] as any
    );

    expect(totalCalories).toBe(150 + 120 + 100 + 20);
  });
});
