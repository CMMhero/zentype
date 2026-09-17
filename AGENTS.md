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
- TypeScript 5.9, Biome for lint + format (config: `biome.json`), vite+ (`oxlint` + `oxfmt`) for the pre-commit hook
- Supabase (auth + Postgres), Upstash Redis (REST), Zustand, Recharts, Tabler icons
- package manager: **pnpm** via vite+ (`vp`) — Node 22.18+

## commands

```bash
vp install           # install deps (pnpm)
vp run dev           # dev server on http://localhost:3123
vp run typecheck     # tsc --noEmit
vp run lint          # biome check . (lint + format + imports)
vp run format        # biome format --write .
vp check             # oxfmt + oxlint + typecheck (same checks the hook runs)
vp run build         # production build (Turbopack)
```

## workflow preferences

- Run `vp run typecheck` and `vp run lint` after edits and keep both green before committing; run `vp run build` for anything larger than a one-liner.
- Commit directly on `dev` with semantic Conventional Commits (`feat(scope):`, `fix(scope):`, `style:`, `refactor:`, `perf:`, `docs:`, `chore:`) — lowercase, imperative subject, body when context helps. Group unrelated changes into separate commits; do not touch `main`.
- `.vite-hooks/pre-commit` runs `vp staged` (`vp check --fix`) on every commit, so it formats and lint-fixes staged files and re-stages them.
- Biome formatting and import sorting are enforced — write code close to biome style or run `vp run format` on touched files.
- ESLint is gone. If you see stale `eslint-disable` comments, remove or convert them to `biome-ignore` comments.
- Lockfiles are gitignored (`pnpm-lock.yaml`, `bun.lock`, `package-lock.json`) — treat them as generated and do not edit them by hand.
- .env values are never committed; the app runs in guest-only mode when SUPABASE/UPSTASH keys are absent — that is expected behavior, not an error.
- Only emit plain commit messages and summaries — no AI-generated trailers or co-author footers.

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->
