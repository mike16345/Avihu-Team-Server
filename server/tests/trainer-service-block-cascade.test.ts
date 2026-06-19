jest.mock("../src/utils/pagination", () => ({
  generatePaginationCacheKey: jest.fn(() => "trainer-service-block-cascade-cache-key"),
}));

jest.mock("../src/utils/utils", () => ({
  stableStringify: jest.fn(() => "{}"),
  deleteUserDataFromAllCollections: jest.fn(),
}));

import mongoose from "mongoose";

process.env.AVIHU_TRAINER_ID = new mongoose.Types.ObjectId().toString();

import { SubTrainerModel } from "../src/models/subTrainerModel";
import { User } from "../src/models/userModel";
import TrainerService from "../src/services/trainerService";

describe("TrainerService block cascade", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("blocking a trainer disables all clients and subtrainer users and marks subtrainer docs inactive", async () => {
    const service = new TrainerService() as any;
    const trainerId = new mongoose.Types.ObjectId();

    jest.spyOn(service, "findById").mockResolvedValue({
      _id: trainerId,
      status: "active",
      videoLibraryAccess: false,
    });
    jest.spyOn(service, "updateById").mockResolvedValue({
      _id: trainerId,
      status: "blocked",
      videoLibraryAccess: false,
    });

    const subTrainerUpdateMany = jest.spyOn(SubTrainerModel, "updateMany").mockResolvedValue({
      acknowledged: true,
      matchedCount: 2,
      modifiedCount: 2,
      upsertedCount: 0,
      upsertedId: null,
    } as any);
    const userUpdateMany = jest.spyOn(User, "updateMany").mockResolvedValue({
      acknowledged: true,
      matchedCount: 5,
      modifiedCount: 5,
      upsertedCount: 0,
      upsertedId: null,
    } as any);

    await service.updateTrainer(trainerId.toString(), { status: "blocked" });

    expect(subTrainerUpdateMany).toHaveBeenCalledWith(
      {
        isDeleted: false,
        trainerId,
      },
      {
        status: "inactive",
      }
    );
    expect(userUpdateMany).toHaveBeenCalledWith(
      {
        isDeleted: false,
        trainerId,
        role: { $in: ["user", "subTrainer"] },
      },
      {
        hasAccess: false,
      }
    );
  });

  test("non-blocking trainer updates do not cascade access changes", async () => {
    const service = new TrainerService() as any;
    const trainerId = new mongoose.Types.ObjectId();

    jest.spyOn(service, "findById").mockResolvedValue({
      _id: trainerId,
      status: "active",
      videoLibraryAccess: false,
    });
    jest.spyOn(service, "updateById").mockResolvedValue({
      _id: trainerId,
      status: "active",
      videoLibraryAccess: false,
    });

    const subTrainerUpdateMany = jest.spyOn(SubTrainerModel, "updateMany").mockResolvedValue({
      acknowledged: true,
    } as any);
    const userUpdateMany = jest.spyOn(User, "updateMany").mockResolvedValue({
      acknowledged: true,
    } as any);

    await service.updateTrainer(trainerId.toString(), { fullName: "Updated Trainer" });

    expect(subTrainerUpdateMany).not.toHaveBeenCalled();
    expect(userUpdateMany).not.toHaveBeenCalled();
  });
});
