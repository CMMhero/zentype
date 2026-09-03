"use server";

import { randomWords, type WordOptions } from "~/lib/prompt-utils";
import type { PromptSource } from "~/lib/types";

const MAX_WORDS = 220;

export async function getPrompt(
  _source: PromptSource,
  want: number,
  opts?: WordOptions,
): Promise<{ text: string; fallback?: boolean }> {
  const w = Math.max(10, Math.min(Math.round(want), MAX_WORDS));
  return { text: randomWords(w, opts) };
}
