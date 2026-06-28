jest.mock("../src/utils/pagination", () => ({
  generatePaginationCacheKey: jest.fn(() => "user-controller-system-user-filter-cache-key"),
}));

jest.mock("../src/utils/utils", () => {
  const actual = jest.requireActual("../src/utils/utils");
  return {
    ...actual,
    stableStringify: jest.fn(() => "{}"),
    deleteUserDataFromAllCollections: jest.fn(),
  };
});

import mongoose from "mongoose";

process.env.AVIHU_TRAINER_ID = new mongoose.Types.ObjectId().toString();

import { getSystemLibraryOwnerObjectId } from "../src/config/systemLibrary";
import { UserController } from "../src/controllers/userController";

describe("UserController system user filter", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("getAll excludes the system admin user from trainer-scoped user lists", async () => {
    const controller = new UserController();
    const find = jest.fn().mockResolvedValue([]);
    (controller as any).service = { find };

    await controller.getAll({
      queryStringParameters: {},
    } as any);

    expect(find).toHaveBeenCalledWith({
      _id: { $ne: getSystemLibraryOwnerObjectId() },
    });
  });
});
