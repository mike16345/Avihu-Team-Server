const deleteObjectPromiseMock = jest.fn();
const deleteObjectMock = jest.fn(() => ({ promise: deleteObjectPromiseMock }));
const removeImageUrlMock = jest.fn();

jest.mock("aws-sdk", () => ({
  S3: jest.fn().mockImplementation(() => ({
    deleteObject: deleteObjectMock,
  })),
}));

jest.mock("../src/services/UserImageUrlService", () => ({
  UserImageUrlService: jest.fn().mockImplementation(() => ({
    removeImageUrl: removeImageUrlMock,
  })),
}));

jest.mock("../src/utils/utils", () => ({
  extractBodyFromEvent: jest.fn((event: any) => JSON.parse(event.body || "{}")),
  createResponse: jest.fn((statusCode: number, message?: string) => ({
    statusCode,
    body: JSON.stringify({ message }),
  })),
  createServerResponse: jest.fn((statusCode: number, message?: string, data?: any) => ({
    statusCode,
    body: JSON.stringify({ message, data }),
  })),
  createServerErrorResponse: jest.fn((error: any) => ({
    statusCode: 500,
    body: JSON.stringify({ message: error?.message || error }),
  })),
}));

import { S3Controller } from "../src/controllers/S3Controller";

describe("S3Controller.handleDeletePhoto", () => {
  beforeEach(() => {
    deleteObjectPromiseMock.mockReset();
    deleteObjectMock.mockClear();
    removeImageUrlMock.mockReset();
    process.env.AWS_BUCKET = "test-bucket";
  });

  afterAll(() => {
    delete process.env.AWS_BUCKET;
  });

  test("removes the stored image url and returns updated urls when deleting a user photo", async () => {
    deleteObjectPromiseMock.mockResolvedValue({});
    removeImageUrlMock.mockResolvedValue(["trainer/new-photo"]);

    const response = await S3Controller.handleDeletePhoto({
      body: JSON.stringify({
        photoId: "images/trainer/old-photo",
        userId: "user-1",
        imageUrl: "trainer/old-photo",
      }),
    } as any);

    expect(deleteObjectMock).toHaveBeenCalledWith({
      Bucket: "test-bucket",
      Key: "images/trainer/old-photo",
    });
    expect(removeImageUrlMock).toHaveBeenCalledWith("user-1", "trainer/old-photo");
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      message: "Photo with ID 'images/trainer/old-photo' deleted successfully.",
      data: ["trainer/new-photo"],
    });
  });

  test("derives the stored image url from photoId when imageUrl is not provided", async () => {
    deleteObjectPromiseMock.mockResolvedValue({});
    removeImageUrlMock.mockResolvedValue([]);

    await S3Controller.handleDeletePhoto({
      body: JSON.stringify({
        photoId: "images/user-2/2026-06-19/photo-1",
        userId: "user-2",
      }),
    } as any);

    expect(removeImageUrlMock).toHaveBeenCalledWith("user-2", "user-2/2026-06-19/photo-1");
  });
});
