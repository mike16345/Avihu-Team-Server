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

export type BinaryClassifierLLMResult = {
  isFitness: boolean;
  raw: string;
  usage?: UsageMetrics;
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
  noContextFallback?: boolean;
};

export type GenerateAnswerResult = {
  answer: string;
  usage?: UsageMetrics;
};

const buildSystemPrompt = (targetLanguage: string) =>
  SYSTEM_PROMPT.replace(/<targetLang>/g, targetLanguage);

const BINARY_CLASSIFIER_SYSTEM_PROMPT = [
  "You are a concise intent classifier for health, fitness, training, recovery, sleep, and nutrition questions.",
  "Answer YES if the user is genuinely asking about exercise, diet, healthy lifestyle habits, or how behaviours impact those goals.",
  "Answer NO if it is trolling, unrelated, or mostly about another topic.",
  "Respond with a single word: YES or NO.",
].join(" ");

const buildBinaryClassifierPrompt = (question: string) =>
  [
    `Question: """${normalizeText(question)}"""`,
    "Is this question about fitness, exercise, nutrition, recovery, or how lifestyle factors influence those areas?",
    "Respond with YES if it is. Otherwise respond with NO.",
  ].join("\n");

const buildPrompt = (params: GenerateAnswerParams): string => {
  const { contextBlocks, question, summary, noContextFallback } = params;
  const promptParts: string[] = [];

  if (noContextFallback) {
    promptParts.push(
      [
        "No retrieved context is available.",
        "Provide concise, fitness and wellness-relevant guidance only.",
        "Do not diagnose; remind users to consult a professional for medical concerns.",
        "Do not include citations or [^i] markers when no context is provided.",
      ].join(" ")
    );
  }

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

export const classifyFitnessIntent = async (
  question: string
): Promise<BinaryClassifierLLMResult> => {
  const client = getClient();
  const prompt = buildBinaryClassifierPrompt(question);

  try {
    const response = await client.chat.completions.create({
      model: RAG_CONSTANTS.binaryClassifierModel,
      messages: [
        { role: "system", content: BINARY_CLASSIFIER_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      max_tokens: RAG_CONSTANTS.binaryClassifierMaxTokens,
      temperature: 0,
    });

    const raw = response.choices?.[0]?.message?.content?.trim?.() || "";
    const normalized = raw.toUpperCase();
    const isFitness = normalized.startsWith("Y");
    const usage: UsageMetrics | undefined = response.usage
      ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        }
      : undefined;

    return { isFitness, raw, usage };
  } catch (error: any) {
    throw new Error(`OpenAI binary classifier error: ${error?.message || error}`);
  }
};

export const createEmbedding = async (text: string): Promise<number[]> => {
  const client = getClient();
  try {
    const response = await client.embeddings.create({
      model: RAG_CONSTANTS.embeddingModel,
      input: normalizeText(text),
      dimensions: RAG_CONSTANTS.embeddingDimensions,
    });

    const embedding = response.data?.[0]?.embedding as number[] | undefined;
    if (!embedding) {
      throw new Error("Embedding not returned by OpenAI");
    }

    const expected = RAG_CONSTANTS.embeddingDimensions;
    if (embedding.length !== expected) {
      throw new Error(
        `Pinecone index dimension (${expected}) != embedding result dimension (${embedding.length})`
      );
    }

    return embedding;
  } catch (error: any) {
    throw new Error(`OpenAI embedding error: ${error?.message || error}`);
  }
};
