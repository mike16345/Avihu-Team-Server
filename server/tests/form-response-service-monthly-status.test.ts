import { FormResponseService } from "../src/services/FormResponseService";

describe("FormResponseService.getMonthlyFormStatus", () => {
  test("returns already submitted when a monthly response exists in the current month", async () => {
    const service = new FormResponseService() as any;
    service.repository = {
      hasSubmittedFormTypeBetween: jest.fn().mockResolvedValue(true),
    };

    await expect(service.getMonthlyFormStatus("user-1", new Date("2026-06-22T12:00:00.000Z"))).resolves
      .toEqual({
        shouldShowMonthlyForm: false,
        reason: "MONTHLY_FORM_ALREADY_SUBMITTED",
      });
  });

  test("returns latest preset and occurrence key when the monthly form was not submitted", async () => {
    const service = new FormResponseService() as any;
    service.repository = {
      hasSubmittedFormTypeBetween: jest.fn().mockResolvedValue(false),
    };
    service.formPresetRepository = {
      findLatestByType: jest.fn().mockResolvedValue({
        _id: "preset-1",
        type: "monthly",
      }),
    };

    await expect(service.getMonthlyFormStatus("user-1", new Date("2026-06-22T12:00:00.000Z"))).resolves
      .toEqual({
        shouldShowMonthlyForm: true,
        presetId: "preset-1",
        occurrenceKey: "2026-06",
        reason: "MONTHLY_FORM_NOT_SUBMITTED",
      });
  });

  test("returns no preset when the user did not submit and no monthly preset exists", async () => {
    const service = new FormResponseService() as any;
    service.repository = {
      hasSubmittedFormTypeBetween: jest.fn().mockResolvedValue(false),
    };
    service.formPresetRepository = {
      findLatestByType: jest.fn().mockResolvedValue(null),
    };

    await expect(service.getMonthlyFormStatus("user-1", new Date("2026-06-22T12:00:00.000Z"))).resolves
      .toEqual({
        shouldShowMonthlyForm: false,
        reason: "NO_MONTHLY_FORM_PRESET",
      });
  });
});
