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
});
