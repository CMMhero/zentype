# Skill ratings: Elo-lite, seeded, provisional, bots count during placement only

Status: accepted

Ranked play uses an Elo-style rating on a centered scale (start ~1000, K=32, provisional racers use double K for their first ten ranked races). New racers are seeded from their recent solo-test WPM mapped onto the scale, so the bots and opponents they first face are near their actual level. Races with 3+ humans update via pairwise expectations: finishing ahead of a racer counts as beating them, scaled for field size.

Ranked play happens only through the skill queue ("find match"). Quick join, public rooms, and private rooms are casual: they award XP but never move ratings. Bots move a human's rating only while that human is provisional, so placement works without waiting for human opponents but established ratings can't be farmed against bots.

Considered options: Glicko-style uncertainty was more honest about new and inactive players but heavier to build and display for a small base. Pure placement (rating derived almost entirely from solo WPM) was rejected because it makes ratings static once the player base grows. Letting bots affect ratings permanently was rejected because everyone would grind bots to inflate their number, and the rating would stop meaning anything.

Consequences: a profile/arena section must show the rating, provisional status, and match history with deltas; long-inactive racers are matched by widening the search window rather than decaying their rating.
