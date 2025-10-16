import OpenAI from "openai";
import { SYSTEM_PROMPT } from "./prompts";
import { normalizeText } from "./text";
import { RAG_CONSTANTS } from "./config";

let cachedClient: OpenAI | null = null;

const getClient = () => {
  if (cachedClient) {
    return cachedClient;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  cachedClient = new OpenAI({ apiKey });
  return cachedClient;
};

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

  const client = getClient();

  if (stream) {
    try {
      const streamResponse = await client.chat.completions.create({
        model: RAG_CONSTANTS.chatModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        stream: true,
        stream_options: { include_usage: true },
      });

      let answer = "";
      let usage: UsageMetrics | undefined;

      for await (const part of streamResponse) {
        const delta = part.choices?.[0]?.delta?.content || "";
        if (delta) {
          answer += delta;
          callbacks?.onDelta?.(delta);
        }

        const chunkUsage = part.usage;
        if (chunkUsage) {
          usage = {
            promptTokens: chunkUsage.prompt_tokens,
            completionTokens: chunkUsage.completion_tokens,
            totalTokens: chunkUsage.total_tokens,
          };
        }
      }

      return { answer: answer.trim(), usage };
    } catch (error: any) {
      throw new Error(`OpenAI error: ${error?.message || error}`);
    }
  }

  try {
    const response = await client.chat.completions.create({
      model: RAG_CONSTANTS.chatModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    });

    const answer = response.choices?.[0]?.message?.content?.trim?.() || "";
    const usage: UsageMetrics | undefined = response.usage
      ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        }
      : undefined;

    return { answer, usage };
  } catch (error: any) {
    throw new Error(`OpenAI error: ${error?.message || error}`);
  }
};

export const createEmbedding = async (text: string): Promise<number[]> => {
  const client = getClient();
  try {
    const response = await client.embeddings.create({
      model: RAG_CONSTANTS.embeddingModel,
      input: normalizeText(text),
    });

    const embedding = response.data?.[0]?.embedding as number[] | undefined;
    if (!embedding) {
      throw new Error("Embedding not returned by OpenAI");
    }

    return embedding;
  } catch (error: any) {
    throw new Error(`OpenAI embedding error: ${error?.message || error}`);
  }
};
