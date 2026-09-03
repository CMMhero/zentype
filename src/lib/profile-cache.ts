import { lcGetEntry, lcSet, lcDel, lcDelPrefix } from "./client-cache";
import type { AggregatedStats, PublicProfile } from "~/server/results";
import type { TestResult } from "./types";

/** Cache entries younger than this are considered fresh — skip refetching. */
export const PROFILE_FRESH_MS = 30_000;
export const PROFILE_CACHE_TTL = 5 * 60 * 1000;
export const POINTS_CACHE_TTL = 60 * 1000;
/** Full test details (chars + timeline) are immutable — cache for 12h. */
export const RESULT_DETAIL_TTL = 12 * 60 * 60 * 1000;

export type ProfilePoints = { totalXP: number; level: number; progress: number };
export type ProfileAchievement = {
  id: string;
  name: string;
  description: string;
  trigger: "metric" | "streak" | "api";
  achievedAt: string | null;
  progress: number;
  xp: number;
};

export interface CachedProfileEntry<T> {
  data: T;
  ageMs: number;
}

/** True when the entry exists and is new enough to skip a refetch. */
export function isFresh(entry: CachedProfileEntry<unknown> | null): boolean {
  return entry !== null && entry.ageMs < PROFILE_FRESH_MS;
}

/* ── key builders (single source of truth for both profile pages) ── */

export const ownStatsKey = (uid: string) => `${uid}:profile-stats`;
export const ownResultsKey = (uid: string) => `${uid}:profile-results`;
export const ownPointsKey = (uid: string) => `${uid}:profile-points`;
export const ownAchKey = (uid: string) => `${uid}:profile-achievements`;
export const ownJoinKey = (uid: string) => `${uid}:profile-join-date`;
export const ownRanksKey = (uid: string) => `${uid}:board-ranks`;

export const pubProfileKey = (username: string) => `pub-${username}`;
export const pubPointsKey = (username: string) => `pub-${username}-points`;
export const pubAchKey = (username: string) => `pub-${username}-ach`;
export const pubRanksKey = (username: string) => `pub-${username}-ranks`;

/* ── full (own) profile cache ── */

export interface OwnProfileCache {
  stats: CachedProfileEntry<AggregatedStats> | null;
  results: CachedProfileEntry<TestResult[]> | null;
  points: CachedProfileEntry<ProfilePoints> | null;
  achievements: CachedProfileEntry<ProfileAchievement[]> | null;
  joinDate: CachedProfileEntry<string> | null;
}

export function readOwnProfileCache(uid: string): OwnProfileCache {
  return {
    stats: lcGetEntry<AggregatedStats>(ownStatsKey(uid), PROFILE_CACHE_TTL),
    results: lcGetEntry<TestResult[]>(ownResultsKey(uid), PROFILE_CACHE_TTL),
    points: lcGetEntry<ProfilePoints>(ownPointsKey(uid), POINTS_CACHE_TTL),
    achievements: lcGetEntry<ProfileAchievement[]>(ownAchKey(uid), PROFILE_CACHE_TTL),
    joinDate: lcGetEntry<string>(ownJoinKey(uid), PROFILE_CACHE_TTL),
  };
}

export function writeOwnProfileCache(
  uid: string,
  data: {
    stats?: AggregatedStats | null;
    results?: TestResult[] | null;
    points?: ProfilePoints | null;
    achievements?: ProfileAchievement[] | null;
    joinDate?: string | null;
  },
): void {
  if (data.stats) lcSet(ownStatsKey(uid), data.stats);
  if (data.results) lcSet(ownResultsKey(uid), data.results);
  if (data.points) lcSet(ownPointsKey(uid), data.points);
  if (data.achievements) lcSet(ownAchKey(uid), data.achievements);
  if (data.joinDate) lcSet(ownJoinKey(uid), data.joinDate);
}

/* ── public profile cache ── */

export interface PublicProfileCache {
  profile: CachedProfileEntry<PublicProfile> | null;
  points: CachedProfileEntry<ProfilePoints> | null;
  achievements: CachedProfileEntry<ProfileAchievement[]> | null;
}

export function readPublicProfileCache(username: string): PublicProfileCache {
  return {
    profile: lcGetEntry<PublicProfile>(pubProfileKey(username), PROFILE_CACHE_TTL),
    points: lcGetEntry<ProfilePoints>(pubPointsKey(username), POINTS_CACHE_TTL),
    achievements: lcGetEntry<ProfileAchievement[]>(pubAchKey(username), PROFILE_CACHE_TTL),
  };
}

/** Convert full-profile data into the public profile shape (lite results). */
export function toPublicProfile(opts: {
  userId: string;
  username: string;
  avatarUrl: string | null;
  joinedAt: string | null;
  stats: AggregatedStats | null;
  results: TestResult[];
}): PublicProfile {
  return {
    userId: opts.userId,
    username: opts.username,
    avatarUrl: opts.avatarUrl,
    joinedAt: opts.joinedAt,
    stats: opts.stats,
    results: opts.results.slice(0, 365).map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      mode: r.mode,
      variant: r.variant,
      wpm: r.wpm,
      accuracy: r.accuracy,
    })),
  };
}

export function writePublicProfileCache(
  username: string,
  data: {
    profile?: PublicProfile | null;
    points?: ProfilePoints | null;
    achievements?: ProfileAchievement[] | null;
    ranks?: Record<string, number> | null;
  },
): void {
  if (data.profile) lcSet(pubProfileKey(username), data.profile);
  if (data.points) lcSet(pubPointsKey(username), data.points);
  if (data.achievements) lcSet(pubAchKey(username), data.achievements);
  if (data.ranks) lcSet(pubRanksKey(username), data.ranks);
}

/**
 * Remove all cached profile data for a user. Call after saving a test so the
 * next profile visit refetches fresh stats instead of serving stale cache.
 */
export function invalidateProfileCaches(uid: string, username: string | null): void {
  lcDel(ownStatsKey(uid));
  lcDel(ownResultsKey(uid));
  lcDel(ownPointsKey(uid));
  lcDel(ownAchKey(uid));
  lcDel(ownJoinKey(uid));
  lcDel(ownRanksKey(uid));
  if (username) {
    lcDel(pubProfileKey(username));
    lcDel(pubPointsKey(username));
    lcDel(pubAchKey(username));
    lcDel(pubRanksKey(username));
  }
  // Leaderboard ranks changed with the new test too
  lcDelPrefix("lb");
}