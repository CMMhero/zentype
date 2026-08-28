# zentype v2

```
┌──────────────────────────────────────────────┐
│  zentype v2                                  │
│  a keyboard-first typing test.               │
└──────────────────────────────────────────────┘
```

A full-stack typing test built on **Next.js** with a clean, modern interface, Geist Mono everywhere, cloud-synced stats, global leaderboards, and
prompts pulled live from the real world — quotes, anime synopses, Wikipedia
extracts and dictionary definitions.

## Features

**Typing**
- time mode (15/30/60/120s) and words mode (10/25/50/100)
- five prompt sources: `english` (offline word pool), `quotes`, `anime`, `wiki`, `dictionary`
- monkeytype-accurate math: net/raw WPM, keystroke-level accuracy, kogasa consistency,
  per-second timeline with error markers
- stop-on-error, strict space, free backspace, blind mode
- WebAudio keystroke sounds (click / thock / beep) — no assets
- virtual keyboard, 4 caret styles, 1–3 visible lines, multiple font families
- five font options: Geist Mono, Inter, JetBrains Mono, System Sans, Serif

**Account & data**
- GitHub / Google OAuth via Supabase Auth (PKCE, httpOnly cookie sessions)
- guests can type immediately; results queue locally and **merge on first login**
- profile dashboard: averages, personal bests per board, wpm/accuracy trend charts,
  12-week activity strip
- full history with per-test detail dialogs
- global leaderboards per mode+variant (Upstash sorted sets, accuracy tie-break,
  80% accuracy floor)
- JSON data export, one-click result wipe

**Keyboard-first**
| keys | action |
|---|---|
| `tab` | restart / new test |
| `enter` | next test (results screen) |
| `ctrl/cmd + k` | command palette (navigate, themes, modes, sources) |
| `?` | shortcut reference |
| `alt + 1..5` | test · leaderboard · profile · history · settings |
| `esc` | close dialogs |

12 built-in terminal themes: gruvbox, nord, dracula, tokyo night, catppuccin
(mocha/latte), everforest, rosé pine, serika dark, matrix, amber terminal, paper white.

## Stack

| layer | tech |
|---|---|
| framework | [Next.js 15](https://nextjs.org/) (App Router, Server Actions) |
| UI | shadcn/ui + Tailwind CSS v4 + Recharts, Geist Mono |
| auth + db | Supabase (OAuth, Postgres, RLS) |
| cache/leaderboards | Upstash Redis (REST) |
| package manager | bun |

## Getting started

```bash
bun install
cp .env.example .env        # fill in your keys
bun run dev                 # http://localhost:3123
```

The app **runs fully without any backend keys** — guest mode, local results,
english prompts, Postgres-fallback leaderboards. Adding keys unlocks sync,
OAuth, external prompt sources and Redis leaderboards.

### Supabase setup (one-time)

1. Create a project at [supabase.com](https://supabase.com) → copy the URL +
   anon key from *Project Settings → API* into `.env`.
2. Open *SQL Editor* and run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   (or `supabase link && supabase db push` with the CLI). This creates
   `profiles` + `test_results`, RLS policies, and the signup trigger.
3. *Authentication → Providers*: enable **GitHub** and **Google**.
   - GitHub: create an OAuth app at github.com/developers → callback URL
     `https://bqtzmtodygwpbqlqqqgz.supabase.co/auth/v1/callback`
   - Google: create OAuth credentials in Google Cloud Console → same callback.
4. *Authentication → URL Configuration*: add your dev/deploy URLs
   (e.g. `http://localhost:3123/auth/callback`).

### Upstash setup (optional but recommended)

1. Create a free database at [console.upstash.com](https://console.upstash.com).
2. Copy the **REST** URL + token into `.env`.
3. Done — leaderboards get fast sorted-set reads, prompt sources get cached
   pools and per-IP rate limiting.

## Project structure

```
src/
├── app/                # Next.js App Router pages
├── components/
│   ├── ui/            # shadcn/ui primitives
│   ├── layout/        # app shell, command palette, help dialog
│   ├── typing/        # config bar, display, caret, virtual keyboard, results
│   └── charts/        # wpm timeline chart
├── hooks/             # use-typing-engine (the game), use-global-hotkeys
├── lib/               # stats math, themes, words, sound, supabase/redis clients
├── server/            # server actions: auth, results, leaderboard, prompts
├── stores/            # zustand: settings (persisted), guest results, ui state
└── styles/            # (unused — CSS is in app/globals.css)
supabase/migrations/   # SQL schema
```

## Stats methodology

- **net wpm** = (correct chars incl. correct spaces) / 5 / minutes
- **raw wpm** = (all typed chars incl. incorrect + spaces) / 5 / minutes — backspaces never count
- **accuracy** = correct keystrokes / total non-backspace keystrokes
- **consistency** = monkeytype's *kogasa* function over per-second raw-wpm samples
- results pass a server-side plausibility gate before touching the database

## Credits

Built by [CMMhero](https://github.com/CMMhero). v1 was a Vite SPA; v2 is the full-stack rebuild.
