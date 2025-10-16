import { SupportedLanguage } from "./language";
import { normalizeText } from "./text";

const FITNESS_KEYWORDS_EN = [
  "diet",
  "nutrition",
  "protein",
  "calorie",
  "training",
  "workout",
  "exercise",
  "cardio",
  "strength",
  "mobility",
  "stretch",
  "recovery",
  "sleep",
  "hydration",
  "meal",
  "macro",
  "weight",
  "fat loss",
  "muscle",
  "fitness",
  "wellness",
  "health",
  "habit",
  "supplement",
  "injury prevention",
  "warm up",
  "cool down",
];

const FITNESS_KEYWORDS_HE = [
  "תזונה",
  "תכנית",
  "תוכנית",
  "אימון",
  "אימונים",
  "כושר",
  "בריאות",
  "חיזוק",
  "חלבון",
  "פחמימות",
  "שומן",
  "קלוריות",
  "ירידה במשקל",
  "עלייה במסת שריר",
  "גמישות",
  "יציבה",
  "שינה",
  "התאוששות",
  "מתיחות",
  "ארוחות",
  "תוספי",
  "תוספים",
  "מאזן אנרגיה",
  "הרגלים",
  "לב",
  "סיבולת",
];

const NON_FITNESS_KEYWORDS = [
  "investment",
  "stock",
  "crypto",
  "software",
  "programming",
  "finance",
  "marketing",
  "sales",
  "legal",
  "tax",
  "פיננס",
  "משפט",
];

export const NOT_FITNESS_MESSAGES: Record<SupportedLanguage, string> = {
  he: "ניתן לשאול רק שאלות בתחום הכושר, התזונה והבריאות הכללית.",
  en: "Please ask about fitness, nutrition, or general wellness topics only.",
};

export type ClassificationResult = {
  isFitness: boolean;
  reason: "FITNESS" | "NOT_FITNESS";
  message?: string;
};

const containsKeyword = (text: string, keywords: string[]) =>
  keywords.some((keyword) => text.includes(keyword));

export const classifyQuestion = (
  question: string,
  targetLanguage: SupportedLanguage
): ClassificationResult => {
  const text = normalizeText(question).toLowerCase();

  if (!text) {
    return {
      isFitness: false,
      reason: "NOT_FITNESS",
      message: NOT_FITNESS_MESSAGES[targetLanguage],
    };
  }

  if (containsKeyword(text, NON_FITNESS_KEYWORDS)) {
    return {
      isFitness: false,
      reason: "NOT_FITNESS",
      message: NOT_FITNESS_MESSAGES[targetLanguage],
    };
  }

  const isFitnessRelated =
    containsKeyword(
      text,
      FITNESS_KEYWORDS_EN.map((k) => k.toLowerCase())
    ) ||
    containsKeyword(
      text,
      FITNESS_KEYWORDS_HE.map((k) => k.toLowerCase())
    );

  if (!isFitnessRelated) {
    return {
      isFitness: false,
      reason: "NOT_FITNESS",
      message: NOT_FITNESS_MESSAGES[targetLanguage],
    };
  }

  return { isFitness: true, reason: "FITNESS" };
};
