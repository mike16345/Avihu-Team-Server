export type SupportedLanguage = "he" | "en";

const HEBREW_REGEX = /[\u0590-\u05FF]/;
const ENGLISH_REGEX = /[A-Za-z]/;
const LETTER_REGEX = /\p{L}/u;

export type LanguageDetection = {
  inputLanguage: SupportedLanguage | "other";
  targetLanguage: SupportedLanguage;
  needsFallbackNotice: boolean;
};

export const detectLanguage = (text: string): LanguageDetection => {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const hasLetters = LETTER_REGEX.test(cleaned);

  let detected: SupportedLanguage | "other" = "other";

  if (HEBREW_REGEX.test(cleaned)) {
    detected = "he";
  } else if (hasLetters && ENGLISH_REGEX.test(cleaned)) {
    detected = "en";
  } else if (!hasLetters) {
    detected = "en"; // default to en when no letters (e.g., numbers only)
  }

  const targetLanguage: SupportedLanguage = detected === "he" ? "he" : detected === "en" ? "en" : "he";
  const needsFallbackNotice = detected === "other";

  return { inputLanguage: detected, targetLanguage, needsFallbackNotice };
};
