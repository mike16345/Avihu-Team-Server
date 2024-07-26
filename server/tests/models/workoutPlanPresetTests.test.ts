import {
  WorkoutPlanPreset,
  WorkoutPlanPresetSchemaValidation,
} from "../../src/models/workoutPlanPresetModel";
import {
  validWorkoutPlanPreset,
  invalidWorkoutPlanPresetEmptyPlans,
  invalidWorkoutPlanPresetNoName,
} from "../fixtures/workoutPlanPresetFixtures";

describe("WorkoutPlanPreset Model", () => {
  it("should create a valid workout plan preset", async () => {
    const preset = new WorkoutPlanPreset(validWorkoutPlanPreset);
    const savedPreset = await preset.save();
    expect(savedPreset._id).toBeDefined();
    expect(savedPreset.name).toBe(validWorkoutPlanPreset.name);
    expect(savedPreset.workoutPlans.length).toBe(validWorkoutPlanPreset.workoutPlans.length);
  });

  it("should throw validation error for empty workout plans array", async () => {
    const preset = new WorkoutPlanPreset(invalidWorkoutPlanPresetEmptyPlans);
    await expect(preset.save()).rejects.toThrow(/Workout plans array cannot be empty/);
  });

  it("should throw validation error for missing name", async () => {
    const preset = new WorkoutPlanPreset(invalidWorkoutPlanPresetNoName);
    await expect(preset.save()).rejects.toThrow(/`name` is required/);
  });
});

describe("WorkoutPlanPreset Schema Validation", () => {
  it("should validate a valid workout plan preset", () => {
    const { error } = WorkoutPlanPresetSchemaValidation.validate(validWorkoutPlanPreset);
    expect(error).toBeUndefined();
  });

  it("should not validate an empty workout plans array", () => {
    const { error } = WorkoutPlanPresetSchemaValidation.validate(
      invalidWorkoutPlanPresetEmptyPlans
    );
    expect(error).toBeDefined();
  });

  it("should not validate a missing name", () => {
    const { error } = WorkoutPlanPresetSchemaValidation.validate(invalidWorkoutPlanPresetNoName);
    expect(error).toBeDefined();
  });
});
