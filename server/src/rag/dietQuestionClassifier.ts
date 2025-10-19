import { SupportedLanguage } from "./language";
import { normalizeText } from "./text";

export const FITNESS_KEYWORDS_EN = [
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

export const FITNESS_KEYWORDS_HE = [
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

export const NON_FITNESS_KEYWORDS = [
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
  positiveMatches: string[];
  negativeMatches: string[];
};

const toLowercaseKeywords = (keywords: string[]) =>
  keywords.map((keyword) => keyword.toLowerCase());

const FITNESS_KEYWORDS_EN_LC = toLowercaseKeywords(FITNESS_KEYWORDS_EN);
const FITNESS_KEYWORDS_HE_LC = toLowercaseKeywords(FITNESS_KEYWORDS_HE);
const NON_FITNESS_KEYWORDS_LC = toLowercaseKeywords(NON_FITNESS_KEYWORDS);

const findMatches = (text: string, keywords: string[]) =>
  keywords.filter((keyword) => text.includes(keyword));

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
      positiveMatches: [],
      negativeMatches: [],
    };
  }

  const negativeMatches = findMatches(text, NON_FITNESS_KEYWORDS_LC);
  if (negativeMatches.length) {
    return {
      isFitness: false,
      reason: "NOT_FITNESS",
      message: NOT_FITNESS_MESSAGES[targetLanguage],
      positiveMatches: [],
      negativeMatches,
    };
  }

  const positiveMatches = Array.from(
    new Set([
      ...findMatches(text, FITNESS_KEYWORDS_EN_LC),
      ...findMatches(text, FITNESS_KEYWORDS_HE_LC),
    ])
  );

  if (!positiveMatches.length) {
    return {
      isFitness: false,
      reason: "NOT_FITNESS",
      message: NOT_FITNESS_MESSAGES[targetLanguage],
      positiveMatches,
      negativeMatches,
    };
  }

  return { isFitness: true, reason: "FITNESS", positiveMatches, negativeMatches };
};
