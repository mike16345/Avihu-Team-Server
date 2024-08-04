// tests/dietPlanPresetModel.test.ts
import mongoose from "mongoose";
import {
  dietPlanSchema,
  DietPlanPresetsModel,
  DietPlanPresetSchemaValidation,
} from "../../src/models/dietPlanPresetModel";
import { validDietPlanPreset, invalidDietPlanPreset } from "../fixtures/dietPlanPresetFixtures";

describe("Mongoose Schemas for Diet Plan Presets", () => {
  test("should validate a valid diet plan preset", async () => {
    const validPreset = new DietPlanPresetsModel(validDietPlanPreset);
    const savedPreset = await validPreset.save();

    expect(savedPreset.name).toBe(validDietPlanPreset.name);
    expect(savedPreset.totalCalories).toBe(validDietPlanPreset.totalCalories);
  });

  test("should throw validation error for invalid diet plan preset", async () => {
    const invalidPreset = new DietPlanPresetsModel(invalidDietPlanPreset);

    await expect(invalidPreset.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });
});

describe("Joi Validation for Diet Plan Presets", () => {
  test("should validate a valid diet plan preset", () => {
    const { error } = DietPlanPresetSchemaValidation.validate(validDietPlanPreset);

    expect(error).toBeUndefined();
  });

  test("should return validation error for invalid diet plan preset", () => {
    const { error } = DietPlanPresetSchemaValidation.validate(invalidDietPlanPreset);

    expect(error).not.toBeUndefined();
  });

  test("should return validation error for missing required fields", () => {
    const invalidPreset = {
      meals: [],
    };
    const { error } = DietPlanPresetSchemaValidation.validate(invalidPreset);

    expect(error).not.toBeUndefined();
  });
});
