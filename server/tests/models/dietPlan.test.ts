import mongoose from "mongoose";
import {
  dietItemSchema,
  mealSchema,
  dietPlanSchema,
  DietPlanSchemaValidation,
} from "../../src/models/dietPlanModel";
import {
  validDietItem,
  invalidDietItem,
  validMeal,
  invalidMeal,
  validDietPlan,
  invalidDietPlan,
} from "../fixtures/dietPlanFixtures";

const { model } = mongoose;

describe("Mongoose Schemas", () => {
  const DietItem = model("DietItem", dietItemSchema);
  const Meal = model("Meal", mealSchema);
  const DietPlan = model("DietPlan", dietPlanSchema);

  test("should validate a valid diet item", async () => {
    const validItem = new DietItem(validDietItem);
    const savedItem = await validItem.save();

    expect(savedItem.quantity).toBe(validDietItem.quantity);
    expect(savedItem.unit).toBe(validDietItem.unit);
  });

  test("should throw validation error for invalid diet item", async () => {
    const invalidItem = new DietItem(invalidDietItem);

    await expect(invalidItem.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test("should validate a valid meal", async () => {
    const validMealDoc = new Meal(validMeal);
    const savedMeal = await validMealDoc.save();

    expect(savedMeal.totalProtein.quantity).toBe(validMeal.totalProtein.quantity);
  });

  test("should throw validation error for invalid meal", async () => {
    const invalidMealDoc = new Meal(invalidMeal);

    await expect(invalidMealDoc.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test("should validate a valid diet plan", async () => {
    const validPlan = new DietPlan(validDietPlan);
    const savedPlan = await validPlan.save();

    expect(savedPlan.userId).toBe(validDietPlan.userId);
    expect(savedPlan.totalCalories).toBe(validDietPlan.totalCalories);
  });

  test("should throw validation error for invalid diet plan", async () => {
    const invalidPlan = new DietPlan(invalidDietPlan);

    await expect(invalidPlan.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });
});

describe("Joi Validation", () => {
  test("should validate a valid diet plan", () => {
    const { error } = DietPlanSchemaValidation.validate(validDietPlan);

    expect(error).toBeUndefined();
  });

  test("should return validation error for invalid diet plan", () => {
    const { error } = DietPlanSchemaValidation.validate(invalidDietPlan);

    expect(error).not.toBeUndefined();
  });

  test("should return validation error for missing required fields", () => {
    const invalidPlan = {
      meals: [validMeal],
    };
    const { error } = DietPlanSchemaValidation.validate(invalidPlan);

    expect(error).not.toBeUndefined();
  });
});
