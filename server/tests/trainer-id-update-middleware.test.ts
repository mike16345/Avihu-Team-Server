import { APIGatewayProxyEvent } from "aws-lambda";
import { validateBlogPost } from "../src/middleware/blogMiddleware";
import { validateDietPlan, validateDietPlanPreset } from "../src/middleware/dietPlanMiddleware";
import { validateDietV2CatalogUpdate } from "../src/middleware/dietV2CatalogMiddleware";
import { validateFormPreset } from "../src/middleware/formPresetMiddleware";
import { validateFormResponse } from "../src/middleware/formResponseMiddleware";
import { validateLessonGroup } from "../src/middleware/lessonGroupsMiddleware";
import { validateMenuItem } from "../src/middleware/menuItemMiddleware";
import {
  validateWorkoutPlan,
  validateWorkoutPlanPreset,
} from "../src/middleware/workoutPlanMiddleware";
import { validDietPlanPreset } from "./fixtures/dietPlanPresetFixtures";
import { validFullWorkoutPlan } from "./fixtures/workoutPlanFixtures";
import { validWorkoutPlanPreset } from "./fixtures/workoutPlanPresetFixtures";

const TRAINER_ID = "507f1f77bcf86cd799439011";
process.env.AVIHU_TRAINER_ID = TRAINER_ID;

import { validateExercise } from "../src/middleware/exercisePresetMiddleware";

const buildEvent = (body: Record<string, unknown>, httpMethod = "PUT"): APIGatewayProxyEvent =>
  ({
    body: JSON.stringify({ ...body, trainerId: TRAINER_ID }),
    httpMethod,
    queryStringParameters: { id: "507f1f77bcf86cd799439012" },
  }) as unknown as APIGatewayProxyEvent;

const validBlog = {
  title: "Title",
  subtitle: "Subtitle",
  content: "Content",
  group: "507f1f77bcf86cd799439013",
};

const validMenuItem = {
  dietaryType: ["regular"],
  foodGroup: "protein",
  name: "Chicken",
  oneServing: { grams: 100 },
};

const validDietPlan = {
  version: 1,
  userId: "507f1f77bcf86cd799439014",
  meals: [
    {
      totalProtein: { quantity: 2 },
      totalCarbs: { quantity: 3 },
      totalFats: { quantity: 1 },
      totalVeggies: { quantity: 1 },
    },
  ],
};

const validExercise = {
  name: "Bench press",
  linkToVideo: "https://www.youtube.com/watch?v=abcdefghijk",
  muscleGroup: "Chest",
};

const validFormPreset = {
  name: "Monthly check-in",
  type: "monthly",
  repeatMonthly: true,
  sections: [
    {
      title: "Progress",
      questions: [{ type: "text", question: "How are you?", required: true }],
    },
  ],
};

const validFormResponse = {
  formId: "507f1f77bcf86cd799439015",
  userId: "507f1f77bcf86cd799439016",
  sections: [
    {
      _id: "section-1",
      title: "Progress",
      questions: [
        {
          _id: "question-1",
          type: "text",
          question: "How are you?",
          answer: "Great",
        },
      ],
    },
  ],
};

describe("trainer-scoped update middleware", () => {
  test.each([
    ["blogs", validateBlogPost, validBlog],
    ["lesson groups", validateLessonGroup, { name: "Nutrition" }],
    ["menu items", validateMenuItem, validMenuItem],
    ["workout plans", validateWorkoutPlan, validFullWorkoutPlan],
    ["diet plans", validateDietPlan, validDietPlan],
    ["diet-v2 catalog items", validateDietV2CatalogUpdate, { name: "Chicken" }],
  ])("accepts and removes client trainerId for %s updates", async (_name, validate, body) => {
    const event = buildEvent(body as Record<string, unknown>);

    const result = await Promise.resolve(validate(event as any, {} as any));

    expect(result.isValid).toBe(true);
    expect(JSON.parse(event.body || "{}")).not.toHaveProperty("trainerId");
  });

  test("returns a validation failure instead of throwing for a null JSON body", () => {
    const event = buildEvent(validBlog);
    event.body = "null";

    expect(validateBlogPost(event).isValid).toBe(false);
    expect(event.body).toBe("null");
  });

  test.each([
    ["diet-plan presets", validateDietPlanPreset, validDietPlanPreset],
    ["workout-plan presets", validateWorkoutPlanPreset, validWorkoutPlanPreset],
    ["exercise presets", validateExercise, validExercise],
    ["form presets", validateFormPreset, validFormPreset],
    ["form responses", validateFormResponse, validFormResponse],
  ])("accepts and removes client trainerId for %s updates", async (_name, validate, body) => {
    const event = buildEvent(body as Record<string, unknown>);

    const result = await Promise.resolve(validate(event as any, {} as any));

    expect(result.isValid).toBe(true);
    expect(JSON.parse(event.body || "{}")).not.toHaveProperty("trainerId");
  });

  test("accepts a workout preset copied from an API response and removes assignment-only fields", () => {
    const event = buildEvent({
      ...validWorkoutPlanPreset,
      _id: "507f1f77bcf86cd799439020",
      __v: 4,
      userId: "507f1f77bcf86cd799439021",
      archivedAt: null,
      replacedByPlanId: "507f1f77bcf86cd799439022",
      assignedBy: "507f1f77bcf86cd799439023",
      assignedAt: "2026-09-28T12:00:00.000Z",
      temporaryUntil: "2026-10-28T12:00:00.000Z",
      restoreToPlanId: "507f1f77bcf86cd799439024",
      assignmentLabel: "Temporary plan",
      createdAt: "2026-09-01T12:00:00.000Z",
      updatedAt: "2026-09-28T12:00:00.000Z",
      workoutsPerWeek: 4,
      level: "advanced",
      goal: "strength",
    });

    const result = validateWorkoutPlanPreset(event);
    const sanitized = JSON.parse(event.body || "{}");

    expect(result.isValid).toBe(true);
    expect(sanitized).toMatchObject({
      name: validWorkoutPlanPreset.name,
      workoutsPerWeek: 4,
      level: "advanced",
      goal: "strength",
    });
    expect(sanitized).not.toHaveProperty("archivedAt");
    expect(sanitized).not.toHaveProperty("assignedAt");
    expect(sanitized).not.toHaveProperty("userId");
    expect(sanitized).not.toHaveProperty("_id");
    expect(sanitized).not.toHaveProperty("__v");
  });

  test("accepts a workout plan copied from an API response while preserving history and meta fields", () => {
    const event = buildEvent({
      ...validFullWorkoutPlan,
      _id: "507f1f77bcf86cd799439029",
      __v: 3,
      userId: "507f1f77bcf86cd799439030",
      archivedAt: null,
      assignedAt: "2026-09-28T12:00:00.000Z",
      assignmentLabel: "Current plan",
      workoutsPerWeek: 5,
      level: "pro",
    });

    const result = validateWorkoutPlan(event);
    const sanitized = JSON.parse(event.body || "{}");

    expect(result.isValid).toBe(true);
    expect(sanitized).toMatchObject({
      archivedAt: null,
      assignmentLabel: "Current plan",
      workoutsPerWeek: 5,
      level: "pro",
    });
    expect(sanitized).not.toHaveProperty("userId");
    expect(sanitized).not.toHaveProperty("_id");
    expect(sanitized).not.toHaveProperty("__v");
  });

  test("accepts a diet preset copied from an API response and removes derived fields", () => {
    const event = buildEvent({
      ...validDietPlanPreset,
      version: 1,
      _id: "507f1f77bcf86cd799439025",
      __v: 2,
      normalizedName: "preset 1",
    });

    const result = validateDietPlanPreset(event);
    const sanitized = JSON.parse(event.body || "{}");

    expect(result.isValid).toBe(true);
    expect(sanitized.name).toBe(validDietPlanPreset.name);
    expect(sanitized).not.toHaveProperty("normalizedName");
    expect(sanitized).not.toHaveProperty("_id");
    expect(sanitized).not.toHaveProperty("__v");
  });

  test("accepts an exercise preset copied from an API response and removes ownership fields", async () => {
    const event = buildEvent({
      ...validExercise,
      _id: "507f1f77bcf86cd799439026",
      __v: 1,
      sourceExerciseId: "507f1f77bcf86cd799439027",
      sourceOwnerId: "507f1f77bcf86cd799439028",
    });

    const result = await validateExercise(event, {} as any);
    const sanitized = JSON.parse(event.body || "{}");

    expect(result.isValid).toBe(true);
    expect(sanitized.name).toBe(validExercise.name);
    expect(sanitized).not.toHaveProperty("sourceExerciseId");
    expect(sanitized).not.toHaveProperty("sourceOwnerId");
    expect(sanitized).not.toHaveProperty("_id");
    expect(sanitized).not.toHaveProperty("__v");
  });
});
