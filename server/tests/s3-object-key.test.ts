import { buildS3ObjectKey } from "../src/utils/s3ObjectKey";

describe("buildS3ObjectKey", () => {
  test("normalizes equivalent Unicode path components", () => {
    expect(
      buildS3ObjectKey({
        folderName: "images",
        clientId: "trainer",
        date: "2026-09-02",
        fileName: "cafe\u0301-שלום-image",
      })
    ).toBe("images/trainer/2026-09-02/café-שלום-image");
  });

  test.each(["clientId", "date", "fileName"] as const)(
    "rejects a missing %s instead of signing an undefined path",
    (missingField) => {
      const input = {
        folderName: "images",
        clientId: "trainer",
        date: "2026-09-02",
        fileName: "image-id",
      };
      delete input[missingField];

      expect(() => buildS3ObjectKey(input)).toThrow(`Missing ${missingField}`);
    }
  );
});
