"use server";

import { getRedis } from "~/lib/redis";
import { shuffle } from "~/lib/utils";
import type { PromptSource } from "~/lib/types";
import { DICT_PROBE_WORDS } from "~/lib/words";
import { randomWords } from "~/lib/prompt-utils";

const MAX_WORDS = 220;

function trimToWords(text: string, want: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  return words.slice(0, Math.min(want, MAX_WORDS)).join(" ");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { "User-Agent": "zentype/2.0", Accept: "application/json" },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

async function fetchQuote(): Promise<string> {
  try {
    const d = await fetchJson(
      "https://api.quotable.io/random?maxLength=200&tags=technology,wisdom,famous-quotes",
    );
    if (d?.content) return `\u201c${d.content}\u201d \u2014 ${d.author}`;
  } catch { /* fall through */ }
  try {
    const d = await fetchJson("https://zenquotes.io/api/random");
    if (Array.isArray(d) && d[0]?.q) return `\u201c${d[0].q}\u201d \u2014 ${d[0].a}`;
  } catch { /* fall through */ }
  throw new Error("quote sources unavailable");
}

async function fetchAnime(): Promise<string> {
  const d = await fetchJson("https://api.jikan.moe/v4/random/anime");
  let s: string = d?.data?.synopsis ?? "";
  s = s
    .replace(/\[Written by MAL Rewrite\]/gi, "")
    .replace(/\(Source:\s*[^)]*\)/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!s || s.length < 60) throw new Error("empty anime synopsis");
  return s.replace(/"/g, "");
}

async function fetchWiki(): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const d = await fetchJson(
      "https://en.wikipedia.org/api/rest_v1/page/random/summary",
    );
    const extract: string = d?.extract ?? "";
    if (extract.length >= 200) {
      const first = extract.split(/(?<=\.)\s+/).slice(0, 4).join(" ");
      return first;
    }
  }
  throw new Error("no suitable wiki article");
}

async function fetchDictionary(): Promise<string> {
  const word = shuffle(DICT_PROBE_WORDS).slice(0, 5);
  for (const w of word) {
    try {
      const d = await fetchJson(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(w)}`,
      );
      const entry = Array.isArray(d) ? d[0] : null;
      const defs: string[] = [];
      for (const m of entry?.meanings ?? []) {
        for (const def of m.definitions ?? []) {
          if (def.definition) defs.push(def.definition);
          if (defs.length >= 2) break;
        }
        if (defs.length >= 2) break;
      }
      if (defs.length === 0) continue;
      return `${entry.word}${entry.phonetic ? ` ${entry.phonetic}` : ""}: ${defs.join(" ")}`;
    } catch {
      continue;
    }
  }
  throw new Error("dictionary lookup failed");
}

const POOL_SIZE = 6;

const FETCHERS: Record<
  Exclude<PromptSource, "words">,
  () => Promise<string>
> = {
  quotes: fetchQuote,
  anime: fetchAnime,
  wiki: fetchWiki,
  dictionary: fetchDictionary,
};

async function nextFromPool(source: Exclude<PromptSource, "words">): Promise<string> {
  const redis = getRedis();
  const key = `pool:${source}`;
  if (redis) {
    const item = await redis.lpop(key);
    if (typeof item === "string" && item.length > 0) {
      if ((await redis.llen(key)) < 2) {
        void refill(redis, key, source).catch(() => {});
      }
      return item;
    }
    await refill(redis, key, source);
    const retry = await redis.lpop(key);
    if (typeof retry === "string" && retry.length > 0) return retry;
  }
  return await FETCHERS[source]();
}

async function refill(redis: NonNullable<ReturnType<typeof getRedis>>, key: string, source: Exclude<PromptSource, "words">) {
  const batch: string[] = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    try {
      batch.push(await FETCHERS[source]());
    } catch {
      break;
    }
  }
  if (batch.length) {
    await redis.rpush(key, ...batch);
    await redis.expire(key, 60 * 60 * 24 * 7);
  }
}

async function rateLimited(): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  try {
    const minute = Math.floor(Date.now() / 60000);
    const key = `rl:server:${minute}`;
    const n = await redis.incr(key);
    if (n === 1) await redis.expire(key, 90);
    return n > 40;
  } catch {
    return false;
  }
}

export async function getPrompt(
  source: PromptSource,
  want: number,
): Promise<{ text: string; fallback?: boolean }> {
  const w = Math.max(10, Math.min(Math.round(want), MAX_WORDS));

  if (source === "words") {
    return { text: randomWords(w) };
  }

  if (await rateLimited()) {
    return { text: randomWords(w), fallback: true };
  }

  try {
    const text = await nextFromPool(source as Exclude<PromptSource, "words">);
    return { text: trimToWords(text, w) };
  } catch (e) {
    console.warn(`[zentype] prompt source '${source}' failed:`, e);
    return { text: randomWords(w), fallback: true };
  }
}
