export const MINIMUM_WORKOUT_SESSION_TIMEOUT = 120; // Represents total minutes.
export const ONE_MINUTE = 60;
export const ONE_MINUTE_IN_MILLISECONDS = 60000;
export const HALF_DAY_IN_MILLISECONDS = 60 * 12 * ONE_MINUTE_IN_MILLISECONDS;
export const ONE_WEEK_IN_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds

export const AVG_PROTEIN_CALORIES = 150;
export const AVG_FAT_CALORIES = 100;
export const AVG_CARB_CALORIES = 115;
export const AVG_VEGGIE_CALORIES = 30;

export const PAGINATION_LIMIT_FALLBACK = 10;
export const PAGINATION_PAGE_FALLBACK = 1;

export const DUPLICATE_PRESET_ERROR = "שם התבנית כבר קיים במערכת!";

export const API_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Expose-Headers": "x-new-access-token",
};
