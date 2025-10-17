import { createEmbedding } from "./openai";
import { normalizeText } from "./text";

const normalizeAndEmbed = async (text: string) => {
  const normalizedQuestion = normalizeText(text);
  const embedding = await createEmbedding(normalizedQuestion);

  return { normalizedQuestion, embedding };
};

export { normalizeAndEmbed };
