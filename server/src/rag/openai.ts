import { SYSTEM_PROMPT } from "./prompts";
import { normalizeText } from "./text";
import { RAG_CONSTANTS } from "./config";

const OPENAI_API_URL = "https://api.openai.com/v1";

const getApiKey = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }
  return apiKey;
};

const baseHeaders = () => ({
  Authorization: `Bearer ${getApiKey()}`,
  "Content-Type": "application/json",
});

export type UsageMetrics = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export type StreamCallbacks = {
  onDelta?: (delta: string) => void;
};

export type GenerateAnswerParams = {
  targetLanguage: string;
  contextBlocks: string[];
  question: string;
  summary?: string;
  stream?: boolean;
  callbacks?: StreamCallbacks;
};

export type GenerateAnswerResult = {
  answer: string;
  usage?: UsageMetrics;
};

const buildSystemPrompt = (targetLanguage: string) =>
  SYSTEM_PROMPT.replace(/<targetLang>/g, targetLanguage);

const buildPrompt = (params: GenerateAnswerParams): string => {
  const { contextBlocks, question, summary } = params;
  const promptParts: string[] = [];

  if (summary) {
    promptParts.push(`Conversation summary: ${summary}`);
  }

  if (contextBlocks.length > 0) {
    promptParts.push(
      contextBlocks
        .map((block, index) => `Context [${index + 1}]: ${normalizeText(block)}`)
        .join("\n")
    );
  }

  promptParts.push(`Question: ${normalizeText(question)}`);

  return promptParts.join("\n\n");
};

export const generateAnswer = async (
  params: GenerateAnswerParams
): Promise<GenerateAnswerResult> => {
  const { stream, callbacks, targetLanguage } = params;
  const systemPrompt = buildSystemPrompt(targetLanguage);
  const prompt = buildPrompt(params);

  const body = {
    model: RAG_CONSTANTS.chatModel,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
    stream: Boolean(stream),
    stream_options: stream ? { include_usage: true } : undefined,
  };

  const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
    method: "POST",
    headers: baseHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI error: ${errorText}`);
  }

  if (stream) {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Streaming is not supported in this environment");
    }

    let answer = "";
    let usage: UsageMetrics | undefined;
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;

        const payload = trimmed.replace(/^data:\s*/, "");
        if (payload === "[DONE]") {
          continue;
        }

        try {
          const json = JSON.parse(payload);
          const delta = json?.choices?.[0]?.delta?.content || "";
          if (delta) {
            answer += delta;
            callbacks?.onDelta?.(delta);
          }
          if (json?.usage) {
            usage = {
              promptTokens: json.usage.prompt_tokens,
              completionTokens: json.usage.completion_tokens,
              totalTokens: json.usage.total_tokens,
            };
          }
        } catch (error) {
          console.error("Failed to parse OpenAI stream chunk", error, payload);
        }
      }
    }

    return { answer: answer.trim(), usage };
  }

  const data = await response.json();
  const answer = data.choices?.[0]?.message?.content?.trim?.() || "";
  const usage: UsageMetrics | undefined = data.usage
    ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      }
    : undefined;

  return { answer, usage };
};

export const createEmbedding = async (text: string): Promise<number[]> => {
  const payload = {
    input: normalizeText(text),
    model: RAG_CONSTANTS.embeddingModel,
  };

  const response = await fetch(`${OPENAI_API_URL}/embeddings`, {
    method: "POST",
    headers: baseHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI embedding error: ${errorText}`);
  }

  const data = await response.json();
  const embedding = data?.data?.[0]?.embedding as number[] | undefined;
  if (!embedding) {
    throw new Error("Embedding not returned by OpenAI");
  }

  return embedding;
};
