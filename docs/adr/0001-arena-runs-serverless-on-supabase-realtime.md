# The arena runs serverless on Supabase Realtime, not a dedicated match server

Status: accepted

The arena needs realtime coordination — lobby presence, race countdowns, live progress — but the app is a serverless Next.js deployment with no long-running process and no existing realtime layer. We chose to build on Supabase Realtime (broadcast + presence + Postgres changes) with authority held in Postgres rows written by Server Actions, rather than adding a dedicated WebSocket match server.

Considered options: a persistent Node/Bun match server would give the tightest timing and the simplest home for bot simulation and matchmaking, but it adds a second service to operate, deploy, and secure for a small player base. A client-authoritative "host owns the room" model was rejected because it has no honest answer for cheating or for what happens when the host leaves.

Consequences: races tolerate ~100–300ms message latency, so the race clock is a server-set start timestamp all clients align to rather than a broadcast "go" event; bot typing is a deterministic per-second schedule computed server-side at race start so every client renders identical bots without server ticks; mid-race rejoin is not supported in v1 because a client that drops cannot resume authority-free state. Requires a migration to publish arena tables to the `supabase_realtime` publication and realtime RLS policies.
