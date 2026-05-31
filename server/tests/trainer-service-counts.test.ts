jest.mock("../src/utils/pagination", () => ({
  generatePaginationCacheKey: jest.fn(() => "trainer-service-counts-cache-key"),
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

describe("TrainerService counts", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("findWithCounts attaches trainee and sub trainer counts to each trainer", async () => {
    const service = new TrainerService();
    const trainerIdOne = new mongoose.Types.ObjectId();
    const trainerIdTwo = new mongoose.Types.ObjectId();

    jest
      .spyOn(service, "find")
      .mockResolvedValue([
        { _id: trainerIdOne, fullName: "Trainer One" } as any,
        { _id: trainerIdTwo, fullName: "Trainer Two" } as any,
      ]);
    jest.spyOn(User, "aggregate").mockResolvedValue([
      { _id: trainerIdOne, count: 7 },
      { _id: trainerIdTwo, count: 3 },
    ] as any);
    jest
      .spyOn(SubTrainerModel, "aggregate")
      .mockResolvedValue([{ _id: trainerIdOne, count: 2 }] as any);

    const result = await service.findWithCounts({});

    expect(User.aggregate).toHaveBeenCalledTimes(1);
    expect(SubTrainerModel.aggregate).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      expect.objectContaining({
        _id: trainerIdOne,
        fullName: "Trainer One",
        traineeCount: 7,
        subTrainerCount: 2,
      }),
      expect.objectContaining({
        _id: trainerIdTwo,
        fullName: "Trainer Two",
        traineeCount: 3,
        subTrainerCount: 0,
      }),
    ]);
  });

  test("findPaginatedWithCounts preserves pagination metadata and enriches results", async () => {
    const service = new TrainerService();
    const trainerId = new mongoose.Types.ObjectId();

    jest.spyOn(service, "findPaginated").mockResolvedValue({
      results: [{ _id: trainerId, fullName: "Trainer" } as any],
      totalResults: 1,
      totalPages: 1,
      currentPage: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
    jest.spyOn(User, "aggregate").mockResolvedValue([{ _id: trainerId, count: 4 }] as any);
    jest
      .spyOn(SubTrainerModel, "aggregate")
      .mockResolvedValue([{ _id: trainerId, count: 1 }] as any);

    const result = await service.findPaginatedWithCounts({
      page: 1,
      limit: 10,
      query: {},
      sort: {},
    });

    expect(result).toEqual({
      results: [
        expect.objectContaining({
          _id: trainerId,
          fullName: "Trainer",
          traineeCount: 4,
          subTrainerCount: 1,
        }),
      ],
      totalResults: 1,
      totalPages: 1,
      currentPage: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });
});
