import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

/** Devuelve el singleton del cliente Anthropic. Lanza error si falta la API key. */
export function getAnthropicClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

export const STORY_MODEL = "claude-sonnet-4-6";
export const STORY_MAX_TOKENS = 4000;
