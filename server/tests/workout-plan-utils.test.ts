import { Types } from "mongoose";
import { sanitizeWorkoutPlanForInsert } from "../src/utils/workoutPlanUtils";

describe("sanitizeWorkoutPlanForInsert", () => {
  test("normalizes populated and serialized ObjectId exercise ids to strings", () => {
    const populatedId = new Types.ObjectId("507f1f77bcf86cd799439011");
    const serializedId = new Types.ObjectId("507f191e810c19729de860ea");

    const serializedBuffer = Object.fromEntries(
      Array.from(serializedId.id).map((byte, index) => [String(index), byte])
    );

    const sanitized = sanitizeWorkoutPlanForInsert({
      tips: [],
      cardio: {
        type: "simple",
        plan: {
          minsPerWeek: 60,
          timesPerWeek: 3,
          minsPerWorkout: 20,
        },
      },
      workoutPlans: [
        {
          planName: "Restore regression",
          muscleGroups: [
            {
              muscleGroup: "Chest",
              exercises: [
                {
                  exerciseId: {
                    _id: populatedId,
                    name: "Bench Press",
                    linkToVideo: "https://example.com/bench",
                  },
                  sets: [{ minReps: 8, maxReps: 10 }],
                  restTime: 60,
                },
                {
                  exerciseId: {
                    buffer: serializedBuffer,
                  },
                  sets: [{ minReps: 10, maxReps: 12 }],
                  restTime: 45,
                },
              ],
            },
          ],
        },
      ],
    } as any) as any;

    expect(sanitized.workoutPlans[0].muscleGroups[0].exercises[0].exerciseId).toBe(
      populatedId.toHexString()
    );
    expect(sanitized.workoutPlans[0].muscleGroups[0].exercises[1].exerciseId).toBe(
      serializedId.toHexString()
    );
  });
});
