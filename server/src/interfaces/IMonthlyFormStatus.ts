export type MonthlyFormStatusReason =
  | "MONTHLY_FORM_ALREADY_SUBMITTED"
  | "NO_MONTHLY_FORM_PRESET"
  | "MISSING_USER"
  | "MONTHLY_FORM_NOT_SUBMITTED";

export type MonthlyFormStatusResponse =
  | {
      shouldShowMonthlyForm: false;
      reason: Exclude<MonthlyFormStatusReason, "MONTHLY_FORM_NOT_SUBMITTED">;
    }
  | {
      shouldShowMonthlyForm: true;
      presetId: string;
      occurrenceKey: string;
      reason: "MONTHLY_FORM_NOT_SUBMITTED";
    };
