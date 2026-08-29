import { shuffle } from "~/lib/utils";
import { ENGLISH_COMMON } from "~/lib/words";

const NUMBERS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
  "10", "11", "12", "13", "14", "15", "20", "21", "24", "25",
  "30", "31", "42", "50", "60", "99", "100", "128", "256", "365"];

/** Words that can take apostrophes for contractions */
const CONTRACTION_BASES: [string, string][] = [
  ["can", "can't"], ["don", "don't"], ["won", "won't"],
  ["is", "isn't"], ["was", "wasn't"], ["are", "aren't"],
  ["has", "hasn't"], ["had", "hadn't"], ["have", "haven't"],
  ["do", "don't"], ["does", "doesn't"], ["did", "didn't"],
  ["would", "wouldn't"], ["could", "couldn't"], ["should", "shouldn't"],
  ["must", "mustn't"], ["need", "needn't"],
  ["we", "we're"], ["they", "they're"], ["you", "you're"],
  ["he", "he's"], ["she", "she's"], ["it", "it's"],
  ["that", "that's"], ["there", "there's"], ["what", "what's"],
  ["who", "who's"],
  ["i", "I'll"], ["we", "we'll"], ["they", "they'll"], ["you", "you'll"],
  ["he", "he'll"], ["she", "she'll"],
  ["i", "I've"], ["we", "we've"], ["they", "they've"], ["you", "you've"],
  ["i", "I'd"], ["we", "we'd"], ["they", "they'd"], ["you", "you'd"],
  ["he", "he'd"], ["she", "she'd"],
  ["let", "let's"],
];

/** Words that commonly appear in quotes */
const QUOTABLE_WORDS = [
  "yes", "no", "well", "right", "sure", "okay", "hello", "goodbye",
  "please", "thanks", "sorry", "hey", "wow", "oh", "maybe", "exactly",
  "never", "always", "indeed", "however", "perhaps", "certainly",
  "enough", "still", "just", "very", "quite", "really",
];

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
    words = words.map((w) =>
      Math.random() < 0.15
        ? NUMBERS[Math.floor(Math.random() * NUMBERS.length)]
        : w,
    );
  }

  if (opts?.punctuation) {
    words = applyPunctuation(words);
  }

  return words;
}

/**
 * Apply realistic punctuation to a word array:
 * - Sentence-ending (. ! ?) capitalizes the next word
 * - Commas, semicolons, colons, dashes as suffixes
 * - Parentheses wrap words: (word)
 * - Quotes wrap words: "word", 'word', „word", 'word'
 * - Contractions: can't, we're, don't, etc.
 */
function applyPunctuation(words: string[]): string[] {
  const result: string[] = [];
  let capitalizeNext = true; // first word is always capitalized in sentences

  for (let i = 0; i < words.length; i++) {
    let word = words[i];

    // Capitalize if needed (after sentence-ending punctuation)
    if (capitalizeNext) {
      word = word.charAt(0).toUpperCase() + word.slice(1);
      capitalizeNext = false;
    }

    // ~8% chance to turn into a contraction
    if (Math.random() < 0.08) {
      const match = CONTRACTION_BASES.find(([base]) => base === word.toLowerCase());
      if (match) {
        word = match[1];
        // Don't capitalize contractions unless sentence start
        if (word === "I'll" || word === "I've" || word === "I'd") {
          // already correct
        }
      }
    }

    // ~12% chance to wrap in quotes
    if (Math.random() < 0.12 && QUOTABLE_WORDS.includes(word.toLowerCase())) {
      const quoteStyle = Math.random();
      if (quoteStyle < 0.35) {
        word = `"${word}"`;
      } else if (quoteStyle < 0.6) {
        word = `'${word}'`;
      } else if (quoteStyle < 0.8) {
        word = `„${word}"`;
      } else {
        word = `'${word}'`;
      }
    } else if (Math.random() < 0.04) {
      // ~4% chance to wrap any word in parentheses
      word = `(${word})`;
    }

    // ~25% chance to add trailing punctuation
    if (Math.random() < 0.25) {
      const roll = Math.random();
      if (roll < 0.35) {
        word = word + ",";
      } else if (roll < 0.55) {
        word = word + ".";
        capitalizeNext = true; // next word gets capitalized
      } else if (roll < 0.7) {
        word = word + ";";
      } else if (roll < 0.8) {
        word = word + ":";
      } else if (roll < 0.88) {
        word = word + "!";
        capitalizeNext = true;
      } else if (roll < 0.96) {
        word = word + "?";
        capitalizeNext = true;
      } else {
        word = word + " —";
      }
    }

    result.push(word);
  }

  return result;
}
