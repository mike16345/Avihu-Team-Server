const getSignedUrlMock = jest.fn(() => "https://signed.example.com/upload");

jest.mock("aws-sdk/clients/s3", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    getSignedUrl: getSignedUrlMock,
  })),
}));

import { handler } from "../src/functions/signedUrl";

const createEvent = (queryStringParameters: Record<string, string>) =>
  ({
    httpMethod: "POST",
    queryStringParameters,
  }) as any;

describe("signed URL handler", () => {
  beforeEach(() => {
    getSignedUrlMock.mockClear();
    process.env.AWS_BUCKET = "test-bucket";
  });

  afterAll(() => {
    delete process.env.AWS_BUCKET;
  });

  test("normalizes Unicode before signing the S3 object key", async () => {
    const response = await handler(
      createEvent({
        userId: "trainer",
        date: "2026-09-02",
        imageName: "cafe\u0301-שלום-image",
      }),
      {} as any
    );

    expect(response?.statusCode).toBe(200);
    expect(getSignedUrlMock).toHaveBeenCalledWith(
      "putObject",
      expect.objectContaining({
        Key: "images/trainer/2026-09-02/café-שלום-image",
      })
    );
  });

  test("returns a bad request when an object-key component is missing", async () => {
    const response = await handler(
      createEvent({
        userId: "trainer",
        date: "2026-09-02",
      }),
      {} as any
    );

    expect(response?.statusCode).toBe(400);
    expect(getSignedUrlMock).not.toHaveBeenCalled();
  });
});
