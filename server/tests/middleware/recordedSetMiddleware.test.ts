import { APIGatewayEvent } from "aws-lambda";
import { validateRecordedSet } from "../../src/middleware/recordedSetMiddleware";

describe("recordedSetMiddleware", () => {
  const baseBody = {
    userId: "user-1",
    muscleGroup: "Chest",
    exercise: "Old Name",
    recordedSets: {
      plan: "Plan A",
      weight: 100,
      repsDone: 8,
      note: "",
      date: new Date(),
    },
  };

  test("requires exerciseId in prod", () => {
    const event = {
      body: JSON.stringify(baseBody),
      requestContext: { stage: "prod" },
    } as APIGatewayEvent;

    const result = validateRecordedSet(event);

    expect(result.isValid).toBe(false);
    expect(result.message).toBe("exerciseId is required");
  });
});
