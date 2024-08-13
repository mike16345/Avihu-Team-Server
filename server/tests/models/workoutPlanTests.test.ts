import mongoose from "mongoose";
import {
  setSchema,
  workoutSchema,
  muscleGroupWorkoutPlanSchema,
  workoutPlanSchema,
  FullWorkoutPlanSchemaValidation,
} from "../../src/models/workoutPlanModel";
import {
  ValidSet,
  InvalidSet,
  ValidWorkout,
  InvalidWorkout,
  ValidMuscleGroupWorkoutPlan,
  InvalidMuscleGroupWorkoutPlan,
  ValidWorkoutPlan,
  InvalidWorkoutPlan,
  ValidDetailedWorkoutPlan,
  InvalidDetailedWorkoutPlan,
  validFullWorkoutPlan,
} from "../fixtures/workoutPlanFixtures";

const { model } = mongoose;

describe("Mongoose Schemas", () => {
  const Set = model("Set", setSchema);
  const Workout = model("Workout", workoutSchema);
  const MuscleGroupWorkoutPlan = model("MuscleGroupWorkoutPlan", muscleGroupWorkoutPlanSchema);
  const WorkoutPlan = model("WorkoutPlan", workoutPlanSchema);

  test("should validate a valid set", async () => {
    const validSet = new Set(ValidSet);
    const savedSet = await validSet.save();

    expect(savedSet.minReps).toBe(ValidSet.minReps);
    expect(savedSet.maxReps).toBe(ValidSet.maxReps);
  });

  test("should throw validation error for invalid set", async () => {
    const invalidSet = new Set(InvalidSet);

    await expect(invalidSet.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test("should validate a valid workout", async () => {
    const validWorkout = new Workout(ValidWorkout);
    const savedWorkout = await validWorkout.save();

    expect(savedWorkout.name).toBe(ValidWorkout.name);
  });

  test("should throw validation error for invalid workout", async () => {
    const invalidWorkout = new Workout(InvalidWorkout);

    await expect(invalidWorkout.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test("should validate a valid muscle group workout plan", async () => {
    const validPlan = new MuscleGroupWorkoutPlan(ValidMuscleGroupWorkoutPlan);
    const savedPlan = await validPlan.save();

    expect(savedPlan.muscleGroup).toBe(ValidMuscleGroupWorkoutPlan.muscleGroup);
  });

  test("should throw validation error for invalid muscle group workout plan", async () => {
    const invalidPlan = new MuscleGroupWorkoutPlan(InvalidMuscleGroupWorkoutPlan);

    await expect(invalidPlan.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test("should validate a valid detailed workout plan", async () => {
    const validPlan = new WorkoutPlan(ValidDetailedWorkoutPlan);
    const savedPlan = await validPlan.save();

    expect(savedPlan.planName).toBe(ValidDetailedWorkoutPlan.planName);
  });

  test("should throw validation error for invalid detailed workout plan", async () => {
    const invalidPlan = new WorkoutPlan(InvalidDetailedWorkoutPlan);

    await expect(invalidPlan.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });
});

describe("Joi Validation", () => {
  test("should validate a valid workout plan", () => {
    const { error } = FullWorkoutPlanSchemaValidation.validate(validFullWorkoutPlan);

    expect(error).toBeUndefined();
  });

  test("should return validation error for invalid workout plan", () => {
    const { error } = FullWorkoutPlanSchemaValidation.validate(InvalidDetailedWorkoutPlan);

    expect(error).not.toBeUndefined();
  });

  test("should return validation error for missing required fields", () => {
    const invalidPlan = {
      muscleGroups: [
        {
          muscleGroup: "Chest",
          muscleGroups: [
            {
              name: "Bench Press",
              sets: [ValidSet],
            },
          ],
        },
      ],
    };
    const { error } = FullWorkoutPlanSchemaValidation.validate(invalidPlan);

    expect(error).not.toBeUndefined();
  });
});
