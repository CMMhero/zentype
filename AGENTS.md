<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# zentype

A clean, customizable typing test with cloud stats (Supabase), Redis-backed leaderboards, XP/achievements, and deep appearance options (200+ themes, 80+ fonts, caret styles, sounds).

## read these before changing code

- `GIT_WORKFLOW.md` — branch strategy (`dev` → `main`), Conventional Commit format, and the AI agent rules (auto-commit, semantic commits, verify safety).
- `STYLE_GUIDE.md` — the design system: color tokens, radius/typography tiers, component patterns, lowercase UI copy, themed-token-only rule.
- `README.md` — feature overview, Supabase/Upstash setup, stats methodology.

## project stack

- Next.js 16 App Router (Turbopack builds) + Server Actions, React 19 with the React Compiler enabled
- shadcn/ui primitives on the Base UI umbrella (`@base-ui/react`), Tailwind CSS v4
- TypeScript 5.9, Biome for lint + format (config: `biome.json`)
- Supabase (auth + Postgres), Upstash Redis (REST), Zustand, Recharts, Tabler icons
- package manager: **bun** — Node 22+

## commands

```bash
bun install          # install deps
bun run dev          # dev server on http://localhost:3123
bun run typecheck    # tsc --noEmit
bun run lint         # biome check . (lint + format + imports)
bun run format       # biome format --write .
bun run build        # production build (Turbopack)
```

## workflow preferences

- Run `bun run typecheck` and `bun run lint` after edits and keep both green before committing; run `bun run build` for anything larger than a one-liner.
- Commit directly on `dev` with semantic Conventional Commits (`feat(scope):`, `fix(scope):`, `style:`, `refactor:`, `perf:`, `docs:`, `chore:`) — lowercase, imperative subject, body when context helps. Group unrelated changes into separate commits; do not touch `main`.
- Biome formatting and import sorting are enforced — write code close to biome style or run `bun run format` on touched files.
- ESLint is gone. If you see stale `eslint-disable` comments, remove or convert them to `biome-ignore` comments.
- `bun.lock` is intentionally gitignored along with `package-lock.json` — treat package-lock.json as stale and do not edit it.
- .env values are never committed; the app runs in guest-only mode when SUPABASE/UPSTASH keys are absent — that is expected behavior, not an error.
- Only emit plain commit messages and summaries — no AI-generated trailers or co-author footers.
