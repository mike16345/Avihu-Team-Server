jest.mock("../src/utils/pagination", () => ({
  generatePaginationCacheKey: jest.fn(() => "user-service-system-user-guard-cache-key"),
}));

jest.mock("../src/utils/utils", () => ({
  stableStringify: jest.fn(() => "{}"),
  deleteUserDataFromAllCollections: jest.fn(),
}));

import mongoose from "mongoose";

process.env.AVIHU_TRAINER_ID = new mongoose.Types.ObjectId().toString();

import { StatusCode } from "../src/enums/StatusCode";
import UserService from "../src/services/userService";

describe("UserService system user guard", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("deleteById blocks deleting the system admin user", async () => {
    const service = new UserService();

    await expect(service.deleteById(process.env.AVIHU_TRAINER_ID!)).rejects.toMatchObject({
      status: StatusCode.FORBIDDEN,
      message: "Cannot delete system admin user.",
    });
  });
});
