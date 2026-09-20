import mongoose from "mongoose";
import {
  TRAINER_SOURCES,
  TRAINER_STATUSES,
  TRAINER_SUBSCRIPTION_PLANS,
} from "../../src/interfaces/ITrainer";
import { TrainerModel, TrainerSchemaValidation } from "../../src/models/trainerModel";

const buildTrainer = (overrides: Record<string, unknown> = {}) => {
  const suffix = new mongoose.Types.ObjectId().toString().slice(-8);

  return {
    fullName: "Diet Version Trainer",
    email: `diet-version-${suffix}@example.com`,
    phone: "+972501234567",
    subscriptionPlan: TRAINER_SUBSCRIPTION_PLANS[0],
    clientLimit: 10,
    subTrainerLimit: 2,
    status: TRAINER_STATUSES[0],
    source: TRAINER_SOURCES[0],
    videoLibraryAccess: false,
    ...overrides,
  };
};

describe("Trainer diet-plan version", () => {
  test("stores version 1 by default for a legacy-compatible trainer", async () => {
    const trainer = await TrainerModel.create(buildTrainer());
    const stored = trainer.toObject() as unknown as Record<string, unknown>;

    expect(stored.dietPlanVersion).toBe(1);
  });

  test("stores an explicitly selected version 2", async () => {
    const trainer = await TrainerModel.create(buildTrainer({ dietPlanVersion: 2 }));
    const stored = trainer.toObject() as unknown as Record<string, unknown>;

    expect(stored.dietPlanVersion).toBe(2);
  });

  test("Joi defaults a missing version to 1 and rejects unsupported versions", () => {
    const defaulted = TrainerSchemaValidation.validate(buildTrainer());
    const unsupported = TrainerSchemaValidation.validate(buildTrainer({ dietPlanVersion: 3 }));

    expect(defaulted.error).toBeUndefined();
    expect(defaulted.value.dietPlanVersion).toBe(1);
    expect(unsupported.error).toBeDefined();
  });
});
