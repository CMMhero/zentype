# zentype

```
┌──────────────────────────────────────────────┐
│  zentype                                     │
│  a customizable, clean typing test.          │
└──────────────────────────────────────────────┘
```

A full-stack typing test built on **Next.js** — customizable, clean, and gamified. Inspired by monkeytype. Mobile-first design with 80+ themes, 50+ fonts, cloud-synced stats, XP/levels, 110+ achievements, streak heatmaps, and global leaderboards.

[![Discord](https://img.shields.io/discord/YOUR_SERVER_ID?label=discord&logo=discord&logoColor=white)](https://discord.gg/zentype)
[![GitHub](https://img.shields.io/github/stars/CMMhero/zentype?logo=github)](https://github.com/CMMhero/zentype)

## Features

**Typing**
- **time** (15/30/60/120s) and **words** (10/25/50/100) modes — switch mid-session from config bar or command palette
- english word pool (offline, pluggable via `getPrompt`)
- monkeytype-accurate math: net/raw WPM, keystroke accuracy, kogasa consistency, per-second timeline
- `stopOnError`, `strictSpace`, `freeBackspace`, `blindMode`, `hideLiveStats`
- WebAudio keystroke sounds (click / thock / beep) with volume + error sound — no assets
- virtual keyboard, 4 caret styles + smooth caret, 1–3 visible lines, 50+ fonts
- live WPM/acc, progress bar, word history + current input with per-char coloring
- **mobile-first** responsive design with bottom navigation, optimized touch targets

**Gamification**
- **XP & levels**: `wpm * 0.5 * accuracy * mode bonus * streak bonus` (+20 perfect bonus), 500 XP per level
- **110+ achievements** in tiers: tests, WPM, accuracy, consistency, streak, time, chars, per-board, averages, level, account age
- every achievement shows real progress (`pct(current/target)`) — streak `max(current,longest)/target`, boards via `bestByBoard`, accuracy/consistency via best single test
- Trophy UI (`achievement-grid` for cards, `achievement-list` for the see-all dialog) with clear unlocked (primary + check) vs locked (muted + grayscale) styling
- XP awarded silently in background via `processTestResult` — no toast/popup blocking chained tests

**Profile & streak**
- header card: avatar, username, email, join date (`profiles.created_at`), level + XP bar
- 2×2 stats: avg WPM (last 10 / all), avg accuracy, time typed
- personal bests per `mode:variant`, separate WPM + accuracy area charts
- top 8 achievements (value-sorted) + “view all” dialog with tabs (all/unlocked/locked)
- **streak calendar** — GitHub-style heatmap with per-day test counts, intensity (1: 40%, 2–3: 70%, 4+: solid), tooltip (`3 tests on …`), and dropdown `Last 12 months` vs dynamic year (from results) with total `N tests in …` header
- **public profile page** — same cards with skeleton loading, personal bests with rank badges, achievement grid, activity calendar; copy profile link button

**Account & data**
- GitHub / Google OAuth via Supabase Auth (PKCE, httpOnly cookies)
- guests type immediately; results queue in `zustand` + `localStorage` and **merge on first login** (`mergeLocalResults`)
- `user_settings` jsonb sync for every `GameSettings` field (theme, font, caret, sound, gameplay) with per-user load, 600 ms debounce, flush on `visibilitychange`/`beforeunload`
- public profiles at `/profile/[username]` — same cards, avatar, bests, charts, achievements, activity; searchable via command palette
- full history table + per-test detail dialog with timeline chart
- JSON export, one-click wipe

**Leaderboards**
- Upstash Redis sorted sets (`lb:{mode:variant}`) with `lbScore(wpm, accuracy)` and `hset` meta (`username`, `avatarUrl`, accuracy tie-break); 80% accuracy floor, auto-expire 1y, fallback to Postgres aggregate when Redis empty
- `LeaderboardRankings` (Trophy) cards with rank/crown, pagination (10/25/50/100), current-user highlight; skeleton matches card layout

**Keyboard-first**
| keys | action |
|---|---|
| `tab` | restart / new test |
| `enter` | next test (results screen) |
| `ctrl/cmd + k` | command palette |
| `?` | shortcuts reference |
| `alt + 1..4` | test · leaderboard · profile · settings (never inserts digits) |
| `esc` | close dialogs |
| `space` / `backspace` | word commit / free backspace |

**Command palette** (`cmdk`)
- fuzzy search across **category + label + description** (`value` + `keywords` on every `CommandItem`), hover highlights via `data-[selected=true]:bg-accent`, user search debounced to `searchUsers` (Supabase `ilike`)
- groups: navigate, actions, mode, theme (80+), sound, caret, font size/family (50+), visible lines, gameplay, appearance

**Appearance**
- 80+ themes via `[data-theme]` CSS vars — gruvbox, nord, dracula, tokyo night, catppuccin mocha/latte, everforest, rosé pine/moon/dawn, serika dark, matrix, amber terminal, paper, one dark, monokai, kanagawa, github dark, solarized dark, cyberpunk, ayu mirage, tokyo night storm, cobalt, mocha light, jellybeans, and more
- 50+ fonts (`data-font` on `<html>`, `@fontsource-variable/*`): geist-mono, inter, jetbrains-mono, dm-sans, space-grotesk, nunito-sans, work-sans, playfair-display, lora, merriweather, fira-code, cabin, josefin, bitter, crimson-pro, roboto-flex, ibm-plex-sans, cascadia-code, commit-mono, victor-mono, and more
- Tailwind CSS v4, shadcn/ui, Recharts 3, Tabler icons
- Dynamic favicon with theme colors

## Stack

| layer | tech |
|---|---|
| framework | [Next.js](https://nextjs.org/) App Router + Server Actions, React 19 |
| UI | shadcn/ui · Tailwind CSS v4 · Recharts 3 · Tabler icons |
| auth + db | Supabase (OAuth, Postgres, RLS) |
| cache/leaderboards | Upstash Redis (REST + `zrange`/`hmget` pipeline) |
| state | Zustand (settings persisted + guest results, ui) |
| package manager | bun · Node 22+ |
| types/lint | TypeScript 5.9 · eslint 9 · `typescript-eslint` |

## Getting started

```bash
bun install
cp .env.example .env        # fill in keys
bun run dev                 # http://localhost:3123
```

Runs **fully without backend keys** — guest mode, local results, english prompts, Postgres-fallback leaderboards. Add keys to unlock sync, OAuth, and Redis leaderboards.

### Supabase setup (one-time)

1. Create project at [supabase.com](https://supabase.com) → copy URL + anon key from *Project Settings → API* into `.env`.
2. **SQL Editor** → run migrations `0001` through `0007` in order (or `supabase link && supabase db push`).
3. *Auth → Providers*: enable **GitHub** + **Google**.
   - GitHub: OAuth app at `github.com/settings/developers` → callback `https://<ref>.supabase.co/auth/v1/callback`
   - Google: credentials in Google Cloud Console → same callback.
4. *Auth → URL Configuration*: add `http://localhost:3123/auth/callback` (and prod URL).

### Upstash setup (optional but recommended)

1. DB at [console.upstash.com](https://console.upstash.com) → copy **REST** URL + token into `.env`.
2. Done — leaderboards get `ZADD`/`ZSCORE`/`HMGET` pipelines + 365-day TTL; prompts get per-IP pools.

### Env

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## Project structure

```
src/
├── app/
│   ├── page.tsx                 # test engine + config bar + result
│   ├── about/page.tsx           # about page with stats and features
│   ├── leaderboard/page.tsx     # filters (mode/variant/period) + rankings
│   ├── profile/page.tsx         # own dashboard (level, stats, bests, charts, achievements, streak, history)
│   ├── profile/[username]/      # public profile (same cards + join date)
│   ├── settings/page.tsx        # sound, typing rules, theme/font/display, account
│   ├── terms/page.tsx           # terms of service
│   ├── privacy/page.tsx         # privacy policy
│   ├── sitemap.ts               # dynamic sitemap generation
│   └── auth/callback/route.ts   # PKCE exchange
├── components/
│   ├── ui/                      # shadcn primitives + Trophy: achievement-{grid,list,badge,unlocked}, streak-{calendar,card}, leaderboard-*
│   ├── layout/                  # app-shell (data-theme/data-font), command-palette (searchable), help
│   ├── typing/                  # config-bar, typing-display, caret, virtual-keyboard, result-view
│   └── charts/                  # wpm timeline
├── hooks/
│   ├── use-typing-engine.ts     # core game loop (ignores alt to avoid digit insertion)
│   ├── use-global-hotkeys.ts    # ctrl/cmd+k, ?, tab, alt+1..4
│   └── use-settings-sync.ts     # per-user DB load (once) + debounced save + flush
├── lib/
│   ├── achievements.ts          # 100+ defs with pct/streakPct + real progress, level + account age tiers
│   ├── xp.ts                    # calculateTestXP, levelFromXP (500/level), xpProgress
│   ├── stats.ts                 # wpm/accuracy/consistency, charBreakdown, plausibility gate
│   ├── themes.ts                # 27 palettes + themeStyleSheet()
│   ├── words.ts / prompt-utils  # offline pool + randomWordSlice
│   ├── sound.ts / supabase/ / redis.ts
│   └── types.ts                 # GameSettings (mode/duration/wordCount/source + 10 gameplay + 7 appearance)
├── server/
│   ├── auth.ts / results.ts     # saveResult, getUserResults/Stats, getMyJoinDate, getPublicProfile, searchUsers, mergeLocalResults
│   ├── leaderboard.ts           # getLeaderboard (Redis fast path → Postgres fallback)
│   ├── gamification.ts          # getUserPoints/Achievements, processTestResult, buildAchievementStats (bestAccuracy/bestConsistency/level/age)
│   ├── settings.ts              # load/save user_settings jsonb
│   └── prompts.ts               # getPrompt
├── stores/
│   ├── settings-store.ts        # zustand persist v4 (migrates legacy {settings:{}} shape, soundVolume → sound.volume)
│   ├── results-store.ts         # guest queue
│   └── ui-store.ts              # palette/help open
└── styles/                      # app/globals.css (+ [data-font] + [data-theme] vars)
public/
├── robots.txt               # crawler rules for search engines and AI bots
└── og.png                   # open graph image
supabase/migrations/
├── 0001_init.sql        # profiles, test_results, RLS, handle_new_user trigger
├── 0002_user_settings.sql
├── 0003_gamification.sql # user_points, point_events, user_achievements + upsert/record/unlock RPCs
├── 0004_leaderboard_rls.sql
├── 0005_leaderboard_rls_user_points.sql
├── 0006_leaderboard_rpc.sql # public leaderboard + achievement RPCs
└── 0007_public_profile_fixes.sql
```

## Stats methodology

- **net wpm** = correct chars (incl. correct spaces) / 5 / minutes
- **raw wpm** = all typed chars (incl. incorrect + extra) / 5 / minutes — backspaces never count
- **accuracy** = correct keystrokes / total non-backspace keystrokes
- **consistency** = kogasa (`1 - stddev/mean` of per-second raw WPM)
- **time typed**: `time` mode = variant seconds; `words` mode = `round(variant*60 / wpm)` capped 5–600s (used for time achievements)
- plausibility gate (`isPlausible`) before any `test_results` insert

## Community

- [Discord](https://discord.gg/zentype) — join the community for discussions, feedback, and support
- [GitHub](https://github.com/CMMhero/zentype) — report issues, contribute, or star the project

## Credits

Built by [CMMhero](https://github.com/CMMhero). Trophy UI by [trophyso/ui](https://ui.trophy.so).
