import { shuffle } from "~/lib/utils";
import { ENGLISH_COMMON } from "~/lib/words";

/** Random english-common word pool — shared by client (words source) and server fallback. */
export function randomWords(count: number): string {
  const out: string[] = [];
  while (out.length < count) out.push(...shuffle(ENGLISH_COMMON));
  return out.slice(0, count).join(" ");
}

export function randomWordSlice(count: number): string[] {
  return shuffle(ENGLISH_COMMON).slice(0, count);
}
