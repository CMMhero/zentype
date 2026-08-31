# zentype

A clean, customizable typing test with cloud stats, gamification, and global leaderboards.

[![GitHub](https://img.shields.io/github/stars/CMMhero/zentype?logo=github)](https://github.com/CMMhero/zentype)

## Features

**Typing test**
- Time (15/30/60/120s) and words (10/25/50/100) modes with punctuation and numbers options
- Monkeytype-accurate stats: net/raw WPM, keystroke accuracy, speed consistency, per-second timeline
- Gameplay options: stop on error, strict space, free backspace, blind mode, hide live stats
- WebAudio sounds (click/thock/beep) with volume control -- no audio assets
- Virtual keyboard, 4 caret styles, smooth caret, 1-3 visible lines

**Gamification**
- XP and levels with streak bonuses and perfect-test bonus
- 100+ achievements across tiers: tests, WPM, accuracy, consistency, streak, time, chars, level, account age
- Real-time progress tracking on every achievement
- Silent XP/achievement processing -- no popups interrupting chained tests

**Profile**
- Dashboard with avatar, level/XP bar, avg WPM, accuracy, time typed
- Personal bests per mode:variant with leaderboard rank badges
- WPM and accuracy trend charts, WPM distribution histogram
- Streak calendar (GitHub-style heatmap) with per-day test counts
- Full test history with per-test detail dialog and timeline chart

**Leaderboards**
- Global rankings by WPM (all-time, this week, today) and level/XP
- Redis-backed with Postgres fallback, 80% accuracy floor
- Your rank highlight, pagination, mode/variant/period filters

**Command palette**
- Fuzzy search across navigation, actions, themes (200+), fonts (80+), settings
- User search for visiting public profiles

**Appearance**
- 200+ themes via CSS custom properties (gruvbox, nord, dracula, catppuccin, tokyo night, and more)
- 80+ fonts via fontsource (geist-mono, inter, jetbrains-mono, work-sans, sora, and more)
- Dynamic favicon that adapts to the active theme

**Account**
- GitHub, Google, and Discord OAuth via Supabase (PKCE, httpOnly cookies)
- Guest mode with local results that sync on first login
- Settings sync across devices via Supabase
- JSON export and one-click data wipe

**Keyboard shortcuts**

| keys | action |
|---|---|
| `tab` | restart / new test |
| `enter` | next test (results screen) |
| `ctrl/cmd + k` | command palette |
| `?` | shortcuts reference |
| `alt + 1..4` | test / leaderboard / profile / settings |
| `esc` | close dialogs |

## Stack

| layer | tech |
|---|---|
| framework | [Next.js](https://nextjs.org/) App Router + Server Actions, React 19 |
| UI | shadcn/ui, Tailwind CSS v4, Recharts, Tabler icons |
| auth + db | Supabase (OAuth, Postgres, RLS) |
| cache | Upstash Redis (REST), client-side localStorage |
| state | Zustand (settings, guest results, UI) |
| package manager | bun, Node 22+ |
| types/lint | TypeScript 5.9, ESLint 9 |

## Getting started

```bash
bun install
cp .env.example .env        # fill in keys
bun run dev                 # http://localhost:3123
```

Runs fully without backend keys. Guest mode, local results, English prompts, and Postgres-fallback leaderboards work out of the box. Add keys to unlock cloud sync, OAuth, and Redis leaderboards.

### Supabase setup (one-time)

1. Create a project at [supabase.com](https://supabase.com). Copy the URL and anon key from *Project Settings > API* into `.env`.
2. **SQL Editor** -- run the migrations in `supabase/migrations/` in order (or `supabase link && supabase db push`).
3. *Auth > Providers* -- enable **GitHub**, **Google**, and **Discord**.
4. *Auth > URL Configuration* -- add `http://localhost:3123/auth/callback` (and your production URL).

### Upstash setup (optional)

1. Create a database at [console.upstash.com](https://console.upstash.com). Copy the REST URL and token into `.env`.
2. Done. Leaderboards use Redis sorted sets; prompts get per-IP pools.

### Env

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## Project structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # typing test engine
│   ├── about/                  # about page with stats
│   ├── leaderboard/            # global rankings
│   ├── profile/                # own dashboard + public profiles
│   ├── settings/               # gameplay, appearance, account
│   ├── auth/callback/          # PKCE exchange
│   └── login/                  # OAuth login
├── components/
│   ├── ui/                     # shadcn primitives + achievement, streak, leaderboard components
│   ├── layout/                 # app shell, command palette, help dialog
│   ├── typing/                 # config bar, typing display, virtual keyboard, result view
│   └── charts/                 # WPM timeline chart
├── hooks/                      # typing engine, hotkeys, settings sync
├── lib/                        # achievements, XP, stats, themes, words, sounds, types
├── server/                     # auth, results, gamification, leaderboards, prompts
├── stores/                     # Zustand stores (settings, results, UI)
└── supabase/migrations/        # database schema and RPC functions
public/
├── robots.txt
├── favicon.ico
└── logo.svg
```

## Stats methodology

- **net WPM** = correct chars (including correct spaces) / 5 / minutes
- **raw WPM** = all typed chars (including incorrect + extra) / 5 / minutes -- backspaces never count
- **accuracy** = correct keystrokes / total non-backspace keystrokes
- **consistency** = how steady your speed was, from per-second raw WPM samples: `100 * (1 - tanh(cv + cv^3/3 + cv^5/5))` where `cv = stddev / mean` (monkeytype's formula)
- **time typed**: time mode = variant seconds; words mode = `round(variant * 60 / wpm)` capped 5-600s

## Development & Contributing

- **[Git Workflow Guide](GIT_WORKFLOW.md)**: Branching strategy, semantic commits, PR lifecycle, and worktree usage.
- **[UI Style Guide](STYLE_GUIDE.md)**: Design principles, typography, icons, color tokens, and component patterns.

## Credits

Built by [CMMhero](https://github.com/CMMhero). Trophy UI components by [trophyso/ui](https://ui.trophy.so).

