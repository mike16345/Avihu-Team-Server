jest.mock("../src/utils/pagination", () => ({
  generatePaginationCacheKey: jest.fn(() => "trainer-service-test-cache-key"),
}));

jest.mock("../src/utils/utils", () => ({
  stableStringify: jest.fn(() => "{}"),
  deleteUserDataFromAllCollections: jest.fn(),
}));

import mongoose from "mongoose";
import {
  TRAINER_SOURCES,
  TRAINER_STATUSES,
  TRAINER_SUBSCRIPTION_PLANS,
} from "../src/interfaces/ITrainer";

process.env.AVIHU_TRAINER_ID = new mongoose.Types.ObjectId().toString();

import TrainerService from "../src/services/trainerService";

const buildTrainerPayload = (overrides: Record<string, unknown> = {}) => ({
  fullName: "New Trainer",
  email: `trainer-${new mongoose.Types.ObjectId().toString().slice(-6)}@example.com`,
  phone: `+9725000${new mongoose.Types.ObjectId().toString().slice(-5)}`,
  subscriptionPlan: TRAINER_SUBSCRIPTION_PLANS[0],
  clientLimit: 20,
  subTrainerLimit: 3,
  status: TRAINER_STATUSES[0],
  source: TRAINER_SOURCES[0],
  videoLibraryAccess: false,
  ...overrides,
});

describe("TrainerService library seeding", () => {
  test("createTrainer seeds Avihu library when videoLibraryAccess is enabled", async () => {
    const service = new TrainerService() as any;
    const copyAvihuLibraryToTrainer = jest.fn().mockResolvedValue(undefined);

    service.exerciseLibraryAccessService = { copyAvihuLibraryToTrainer };
    service.userService = {
      createUserWithWelcome: jest
        .fn()
        .mockResolvedValue({ _id: new mongoose.Types.ObjectId(), email: "user@example.com" }),
    };

    const trainer = await service.createTrainer(buildTrainerPayload({ videoLibraryAccess: true }));

    expect(copyAvihuLibraryToTrainer).toHaveBeenCalledTimes(1);
    expect(copyAvihuLibraryToTrainer).toHaveBeenCalledWith(trainer._id.toString());
  });

  test("createTrainer skips library seeding when videoLibraryAccess is disabled", async () => {
    const service = new TrainerService() as any;
    const copyAvihuLibraryToTrainer = jest.fn().mockResolvedValue(undefined);

    service.exerciseLibraryAccessService = { copyAvihuLibraryToTrainer };
    service.userService = {
      createUserWithWelcome: jest
        .fn()
        .mockResolvedValue({ _id: new mongoose.Types.ObjectId(), email: "user@example.com" }),
    };

    await service.createTrainer(buildTrainerPayload({ videoLibraryAccess: false }));

    expect(copyAvihuLibraryToTrainer).not.toHaveBeenCalled();
  });
});
