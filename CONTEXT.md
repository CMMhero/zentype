# zentype

A clean, customizable typing test app. Solo tests, gamification, and profiles are the core; the **arena** is the realtime multiplayer racing mode where players type the same passage head-to-head.

## Language

### Racing

**Race**:
A head-to-head typing contest in which every racer types the same passage, ranked by corrected finish time. The atomic unit of arena competition; begins when its room's countdown ends.
_Avoid_: match, game, duel

**Passage**:
The exact text every racer in a race types — one server-generated text, identical for all racers, chosen at race creation.
_Avoid_: prompt (a solo-test concept with per-player randomness)

**Ranked race**:
A race that changes participants' skill ratings. Only races started through the skill queue are ranked.
_Avoid_: competitive, rated match

**Casual race**:
A race that never changes skill ratings — reached via quick join, public rooms, or private rooms. Casual races still award XP like a solo test.

### Rooms

**Room**:
A gathering place that converts into a race when its countdown ends. Public rooms appear in the lobby list; private rooms are invite-code only; the skill queue auto-creates rooms for matched racers.
_Avoid_: session, game room

**Lobby**:
The arena home screen where players browse public rooms, quick join, create rooms, or enter the skill queue.

**Quick join**:
Entering the first open public room without browsing the list.

**Backfill**:
Filling a room's empty seats with bots (up to its target size) so a race can start even when few humans are online.

### Rating

**Skill rating**:
The number used to match racers and adjusted by ranked races. Seeded from recent solo performance, tracked separately from XP and level.
_Avoid_: elo, mmr, points

**Provisional**:
The state of a racer with fewer than ten ranked races, during which their skill rating changes quickly and races against bots still count toward it, so new racers get placed without waiting for human opponents.

### Players

**Bot**:
A clearly-labeled synthetic racer that backfills rooms, performing near the skill level of the humans in the room.

**Guest**:
An unauthenticated player who picked an arena name (shown with a guest indicator). Guests play casual races in public rooms only; ranked and private play require an account.

**Arena name**:
A guest's self-chosen name, displayed in races with a guest badge. Signed-in racers display their account username instead.
