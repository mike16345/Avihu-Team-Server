import { normalizeText } from "./text";

const GREETING_PATTERNS: RegExp[] = [
  /^hi(?: there)?$/i,
  /^hello(?: there)?$/i,
  /^hey(?: there)?$/i,
  /^shalom$/i,
  /^שלום$/,
  /^בוקר טוב$/,
  /^ערב טוב$/,
  /^צהריים טובים$/,
  /^good (?:morning|afternoon|evening)$/i,
  /^hiya$/i,
  /^yo$/i,
];

export const isGreeting = (rawText: string): boolean => {
  const text = normalizeText(rawText);
  if (!text) {
    return false;
  }

  if (/[?]/.test(text)) {
    return false;
  }

  const cleaned = text.replace(/[!.,]/g, "").trim();

  if (!cleaned) {
    return false;
  }

  if (cleaned.length > 40) {
    return false;
  }

  return GREETING_PATTERNS.some((pattern) => pattern.test(cleaned));
};
