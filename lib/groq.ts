import Groq from "groq-sdk";
import { config } from "./config";

export function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

export async function groqJsonCompletion<T>(prompt: string): Promise<T> {
  const client = getGroqClient();
  if (!client) {
    throw new Error("GROQ_API_KEY is not set.");
  }

  const completion = await client.chat.completions.create({
    model: config.groqModel,
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that responds with valid JSON only. Do not wrap the response in markdown code fences.",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.4,
    max_completion_tokens: 2048,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response received from Groq API");
  }

  return JSON.parse(content) as T;
}

export interface TimedSentence {
  text: string;
  start: number;
  end: number;
}

/** Rough token estimate for English / JSON-ish text. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Compact line format: start-end|sentence text */
export function formatSentencesCompact(sentences: TimedSentence[]): string {
  return sentences
    .map((s) => `${s.start.toFixed(1)}-${s.end.toFixed(1)}|${s.text}`)
    .join("\n");
}

/**
 * Split sentences into chunks that fit under a token budget.
 * Keeps chronological order so clip boundaries stay coherent.
 */
export function chunkSentencesByTokens(
  sentences: TimedSentence[],
  maxInputTokens = config.groqMaxInputTokens,
  promptOverheadTokens = 600,
): TimedSentence[][] {
  if (sentences.length === 0) return [];

  const budget = Math.max(1500, maxInputTokens - promptOverheadTokens);
  const chunks: TimedSentence[][] = [];
  let current: TimedSentence[] = [];
  let currentTokens = 0;

  for (const sentence of sentences) {
    const lineTokens = estimateTokens(
      `${sentence.start.toFixed(1)}-${sentence.end.toFixed(1)}|${sentence.text}\n`,
    );

    if (current.length > 0 && currentTokens + lineTokens > budget) {
      chunks.push(current);
      current = [];
      currentTokens = 0;
    }

    current.push(sentence);
    currentTokens += lineTokens;
  }

  if (current.length > 0) {
    chunks.push(current);
  }

  return chunks;
}
