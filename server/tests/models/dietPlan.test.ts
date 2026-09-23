import mongoose from "mongoose";
import {
  dietItemSchema,
  mealSchema,
  dietPlanSchema,
  DietPlanSchemaValidation,
  DietPlanUpdateSchemaValidation,
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

  test.each([1, 2])("should persist unit display mode %i", async (unitDisplayMode) => {
    const plan = new DietPlan({ ...validDietPlan, unitDisplayMode });
    const savedPlan = await plan.save();

    expect(savedPlan.get("unitDisplayMode")).toBe(unitDisplayMode);
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

  test("should remain valid when unit display mode is omitted", () => {
    const { error } = DietPlanSchemaValidation.validate(validDietPlan);

    expect(error).toBeUndefined();
  });

  test.each([1, 2])("should accept unit display mode %i", (unitDisplayMode) => {
    const { error } = DietPlanSchemaValidation.validate({ ...validDietPlan, unitDisplayMode });

    expect(error).toBeUndefined();
  });

  test.each([0, 3])("should reject invalid unit display mode %i", (unitDisplayMode) => {
    const { error } = DietPlanSchemaValidation.validate({ ...validDietPlan, unitDisplayMode });

    expect(error).toBeDefined();
  });

  test("should allow legacy updates without unit display mode", () => {
    const { error } = DietPlanUpdateSchemaValidation.validate(validDietPlan);

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
