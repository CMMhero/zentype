import { shuffle } from "~/lib/utils";
import { ENGLISH_COMMON } from "~/lib/words";

const NUMBERS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
  "10", "11", "12", "13", "14", "15", "20", "21", "24", "25",
  "30", "31", "42", "50", "60", "99", "100", "128", "256", "365"];
const PUNCTUATION = [",", ".", ";", ":", "!", "?", "-", "(", ")"];

export interface WordOptions {
  punctuation?: boolean;
  numbers?: boolean;
}

/** Random english-common word pool — shared by client (words source) and server fallback. */
export function randomWords(count: number, opts?: WordOptions): string {
  return randomWordSlice(count, opts).join(" ");
}

export function randomWordSlice(count: number, opts?: WordOptions): string[] {
  let words = shuffle(ENGLISH_COMMON).slice(0, count);
  if (opts?.numbers) {
    words = words.map((w) => Math.random() < 0.15 ? NUMBERS[Math.floor(Math.random() * NUMBERS.length)] : w);
  }
  if (opts?.punctuation) {
    // ~30% get a punctuation suffix, ~20% get capitalized, some get both
    words = words.map((w) => {
      let result = w;
      if (Math.random() < 0.3) {
        result = result + PUNCTUATION[Math.floor(Math.random() * PUNCTUATION.length)];
      }
      if (Math.random() < 0.2) {
        result = result.charAt(0).toUpperCase() + result.slice(1);
      }
      return result;
    });
  }
  return words;
}
