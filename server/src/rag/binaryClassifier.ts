import { normalizeText } from "./text";
import {
  FITNESS_KEYWORDS_EN,
  FITNESS_KEYWORDS_HE,
  NON_FITNESS_KEYWORDS,
} from "./dietQuestionClassifier";
import { classifyFitnessIntent, BinaryClassifierLLMResult } from "./openai";

const ADDITIONAL_POSITIVE_KEYWORDS = [
  "gym",
  "running",
  "run",
  "jog",
  "swim",
  "yoga",
  "pilates",
  "strength",
  "conditioning",
  "mobility",
  "stretching",
  "meal prep",
  "meal-prep",
  "supplements",
  "supplementation",
  "macro",
  "macros",
  "hydration",
  "sleep",
  "rest",
  "recovery",
  "cardio",
  "lifting",
  "lift",
];

const ADDITIONAL_POSITIVE_KEYWORDS_HE = [
  "כושר",
  "התאוששות",
  "תזונה",
  "ארוחה",
  "ארוחות",
  "אימוני",
  "אימון",
  "נשימה",
  "ריצה",
  "שחייה",
  "פילאטיס",
  "חיזוק",
  "גמישות",
  "שינה",
  "חלבון",
];

const POSITIVE_KEYWORDS = Array.from(
  new Set([
    ...FITNESS_KEYWORDS_EN,
    ...FITNESS_KEYWORDS_HE,
    ...ADDITIONAL_POSITIVE_KEYWORDS,
    ...ADDITIONAL_POSITIVE_KEYWORDS_HE,
  ])
)
  .map((keyword) => keyword.toLowerCase())
  .sort((a, b) => a.localeCompare(b));

const NEGATIVE_KEYWORDS = Array.from(new Set(NON_FITNESS_KEYWORDS))
  .map((keyword) => keyword.toLowerCase())
  .sort((a, b) => a.localeCompare(b));

export type BinaryClassifierResult = {
  isFitness: boolean;
  score: number;
  matchedPositive: string[];
  matchedNegative: string[];
};

const findMatches = (text: string, keywords: string[]): string[] => {
  const matches = keywords.filter((keyword) => text.includes(keyword));
  return matches.length ? Array.from(new Set(matches)) : [];
};

export const runBinaryClassifier = (question: string): BinaryClassifierResult => {
  const normalized = normalizeText(question).toLowerCase();
  if (!normalized) {
    return { isFitness: false, score: 0, matchedPositive: [], matchedNegative: [] };
  }

  const positiveMatches = findMatches(normalized, POSITIVE_KEYWORDS);
  const negativeMatches = findMatches(normalized, NEGATIVE_KEYWORDS);

  const score = positiveMatches.length - negativeMatches.length * 1.5;

  return {
    isFitness: score > 0,
    score,
    matchedPositive: positiveMatches,
    matchedNegative: negativeMatches,
  };
};

export const runBinaryClassifierLLM = async (
  question: string
): Promise<BinaryClassifierLLMResult> => classifyFitnessIntent(question);
