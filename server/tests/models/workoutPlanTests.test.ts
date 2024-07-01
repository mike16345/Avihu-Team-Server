import mongoose from "mongoose";
import Joi from "joi";
import {
  setSchema,
  workoutSchema,
  muscleGroupWorkoutPlanSchema,
  workoutPlanSchema,
  WorkoutPlanSchemaValidation,
} from "../../src/models/workoutPlanModel";

const { model, connect, connection } = mongoose;

beforeAll(async () => {
  await connect("mongodb://127.0.0.1:27017/testdb");
});

afterAll(async () => {
  await connection.db.dropDatabase();
  await connection.close();
});

describe("Mongoose Schemas", () => {
  const Set = model("Set", setSchema);
  const Workout = model("Workout", workoutSchema);
  const MuscleGroupWorkoutPlan = model("MuscleGroupWorkoutPlan", muscleGroupWorkoutPlanSchema);
  const WorkoutPlan = model("WorkoutPlan", workoutPlanSchema);

  test("should validate a valid set", async () => {
    const validSet = new Set({ minReps: 8, maxReps: 12 });
    const savedSet = await validSet.save();
    expect(savedSet.minReps).toBe(8);
    expect(savedSet.maxReps).toBe(12);
  });

  test("should throw validation error for invalid set", async () => {
    const invalidSet = new Set({ maxReps: 12 });
    await expect(invalidSet.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test("should validate a valid workout", async () => {
    const validWorkout = new Workout({
      name: "Bench Press",
      sets: [{ minReps: 8, maxReps: 12 }],
      linkToVideo: "http://example.com/benchpress",
      tipFromTrainer: "Keep your back flat on the bench.",
    });
    const savedWorkout = await validWorkout.save();
    expect(savedWorkout.name).toBe("Bench Press");
  });

  test("should throw validation error for invalid workout", async () => {
    const invalidWorkout = new Workout({
      sets: [{ minReps: 8, maxReps: 12 }],
    });
    await expect(invalidWorkout.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test("should validate a valid muscle group workout plan", async () => {
    const validPlan = new MuscleGroupWorkoutPlan({
      muscleGroup: "Chest",
      workouts: [
        {
          name: "Bench Press",
          sets: [{ minReps: 8, maxReps: 12 }],
        },
      ],
    });
    const savedPlan = await validPlan.save();
    expect(savedPlan.muscleGroup).toBe("Chest");
  });

  test("should throw validation error for invalid muscle group workout plan", async () => {
    const invalidPlan = new MuscleGroupWorkoutPlan({
      muscleGroup: "Chest",
      workouts: [],
    });
    await expect(invalidPlan.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test("should validate a valid detailed workout plan", async () => {
    const validPlan = new WorkoutPlan({
      planName: "Beginner Plan",
      userId: "1",
      workouts: [
        {
          muscleGroup: "Chest",
          workouts: [
            {
              name: "Bench Press",
              sets: [{ minReps: 8, maxReps: 12 }],
            },
          ],
        },
      ],
    });
    const savedPlan = await validPlan.save();
    expect(savedPlan.planName).toBe("Beginner Plan");
  });

  test("should throw validation error for invalid detailed workout plan", async () => {
    const invalidPlan = new WorkoutPlan({
      planName: "This plan name is way too long and exceeds the maximum allowed length",
      workouts: [
        {
          muscleGroup: "Chest",
          workouts: [
            {
              name: "Bench Press",
              sets: [{ minReps: 8, maxReps: 12 }],
            },
          ],
        },
      ],
    });

    await expect(invalidPlan.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });
});

describe("Joi Validation", () => {
  test("should validate a valid workout plan", () => {
    const validPlan = {
      planName: "Beginner Plan",
      userId: "1",
      workouts: [
        {
          muscleGroup: "Chest",
          workouts: [
            {
              name: "Bench Press",
              sets: [{ minReps: 8, maxReps: 12 }],
              linkToVideo: "http://example.com/benchpress",
              tipFromTrainer: "Keep your back flat on the bench.",
            },
          ],
        },
      ],
    };
    const { error } = WorkoutPlanSchemaValidation.validate(validPlan);
    expect(error).toBeUndefined();
  });

  test("should return validation error for invalid workout plan", () => {
    const invalidPlan = {
      planName: "This plan name is way too long and exceeds the maximum allowed length",
      workouts: [
        {
          muscleGroup: "Chest",
          workouts: [
            {
              name: "Bench Press",
              sets: [{ minReps: 8, maxReps: 12 }],
            },
          ],
        },
      ],
    };
    const { error } = WorkoutPlanSchemaValidation.validate(invalidPlan);
    expect(error).not.toBeUndefined();
  });

  test("should return validation error for missing required fields", () => {
    const invalidPlan = {
      workouts: [
        {
          muscleGroup: "Chest",
          workouts: [
            {
              name: "Bench Press",
              sets: [{ minReps: 8, maxReps: 12 }],
            },
          ],
        },
      ],
    };
    const { error } = WorkoutPlanSchemaValidation.validate(invalidPlan);
    expect(error).not.toBeUndefined();
  });
});
