jest.mock("../src/utils/utils", () => {
  return {
    createServerResponse: jest.fn((statusCode: number, message?: string, data?: any) => ({
      statusCode,
      body: JSON.stringify({ message, data }),
    })),
    extractBodyFromEvent: jest.fn((event: any) => JSON.parse(event.body || "{}")),
  };
});

import { UserImageUrlController } from "../src/controllers/UserImageUrlController";

describe("UserImageUrlController.swapImageUrls", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("returns the swapped image url list", async () => {
    const controller = new UserImageUrlController();
    const swapImageUrls = jest
      .fn()
      .mockResolvedValue(["user/photo-2", "user/photo-1", "user/photo-3"]);

    (controller as any).service = { swapImageUrls };

    const response = await controller.swapImageUrls({
      body: JSON.stringify({
        userId: "user-1",
        oldImageUrl: "user/photo-1",
        newImageUrl: "user/photo-2",
      }),
    } as any);

    expect(swapImageUrls).toHaveBeenCalledWith("user-1", "user/photo-1", "user/photo-2");
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      message: "Image URLs swapped successfully",
      data: ["user/photo-2", "user/photo-1", "user/photo-3"],
    });
  });

  test("returns graceful errors from the swap flow", async () => {
    const controller = new UserImageUrlController();
    const swapImageUrls = jest.fn().mockRejectedValue({
      status: 404,
      message: "One or both image URLs not found for swap.",
    });

    (controller as any).service = { swapImageUrls };

    const response = await controller.swapImageUrls({
      body: JSON.stringify({
        userId: "user-1",
        oldImageUrl: "user/missing-1",
        newImageUrl: "user/missing-2",
      }),
    } as any);

    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body)).toEqual({
      message: "One or both image URLs not found for swap.",
    });
  });
});
