"use server";

import type { PromptSource } from "~/lib/types";
import { randomWords } from "~/lib/prompt-utils";

const MAX_WORDS = 220;

export async function getPrompt(
  _source: PromptSource,
  want: number,
): Promise<{ text: string; fallback?: boolean }> {
  const w = Math.max(10, Math.min(Math.round(want), MAX_WORDS));
  return { text: randomWords(w) };
}
