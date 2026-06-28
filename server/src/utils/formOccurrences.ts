type FormLike = {
  type: "onboarding" | "monthly" | "general";
  showOn?: Date;
};

const pad = (value: number) => String(value).padStart(2, "0");

export const getMonthOccurrenceKey = (date: Date = new Date()) =>
  `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;

export const getDateOccurrenceKey = (date: Date | string) => {
  const parsedDate = new Date(date);

  return `${parsedDate.getUTCFullYear()}-${pad(parsedDate.getUTCMonth() + 1)}-${pad(
    parsedDate.getUTCDate()
  )}`;
};

export const getOccurrenceKeyForForm = (form: FormLike, now: Date = new Date()) => {
  if (form.type === "monthly") {
    return getMonthOccurrenceKey(now);
  }

  if (form.type === "general" && form.showOn) {
    return getDateOccurrenceKey(form.showOn);
  }

  if (form.type === "onboarding") {
    return "onboarding";
  }

  return null;
};
