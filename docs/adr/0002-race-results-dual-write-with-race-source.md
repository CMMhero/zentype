# Race results dual-write into test results with a race source

Status: accepted

Every finished race writes an authoritative arena record (players, placement, per-player WPM/accuracy, skill-rating deltas, passage, duration) **and** each human's race as a normal test-result row tagged `source = 'race'`. Race rows flow through the existing XP, achievement, and aggregate-stats pipelines automatically, but are excluded from global leaderboards and personal-best detection so solo boards stay pure.

Considered options: recording races only in a separate table keeps solo stats pristine but disconnects race typing from normal progress — achievements and averages would never credit it, and players would wonder why a race didn't touch their stats. Dual-writing reuses a battle-tested pipeline at the cost of filtering `source = 'race'` wherever boards and bests are computed (Redis all-time boards are unaffected since race inserts bypass `saveResult`; this-week/today Postgres boards and PB lookups must filter).

Consequences: race results appear in test history with a race badge; arena standings and win/loss records come from the arena records; race XP flows through `point_events` as a distinct event type so history can show placement alongside the base test XP.
