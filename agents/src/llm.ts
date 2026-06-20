import { ChatOpenAI } from "@langchain/openai";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export function hasLlmProvider(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function createChatModel(): BaseChatModel | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  return new ChatOpenAI({
    apiKey,
    model: DEFAULT_MODEL,
    temperature: 0.2,
  });
}