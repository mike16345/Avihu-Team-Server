export const normalizeText = (text: string): string => text.replace(/\s+/g, " ").trim();

export const summariseSentences = (text: string, maxSentences: number): string => {
  const clean = normalizeText(text);
  if (!maxSentences || maxSentences <= 0) return clean;

  const sentences = clean.split(/(?<=[.!?])\s+/);
  if (sentences.length <= maxSentences) {
    return clean;
  }

  return sentences.slice(0, maxSentences).join(" ");
};
