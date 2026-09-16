# Jason's Cheat Sheet — context for Claude Code

## What this is
Tampermonkey userscript that overlays Yahoo Fantasy Basketball's live draft room
(`basketball.fantasysports.yahoo.com/draftclient/*`). It syncs picks live, ranks Jason's team in each
category against the other 11 rosters, and suggests the next pick.

League: Yahoo H2H 9-cat (FG%, FT%, 3PM, PTS, REB, AST, STL, BLK, TO), 12 teams, snake with 3rd-round
reversal, Jason picks 12th. Strategy and player data live in `docs/` — read them before changing
suggestion logic.

User preferences: main points, no fluff. Say "I don't know" and verify when uncertain.

## Files
- `src/userscript.template.js` — the source. Edit this, never the built file.
- `src/proj.json` — saved projections for 250 players: `[name, team, pos, [GP, FG%, FT%, 3PM, PTS, REB, AST, STL, BLK, TO]]` per game. Fallback only.
- `build.js` — replaces `__PROJ__` with proj.json, `__VERSION__` with the template's `@version`, and `__XRANK__` with the xRank column parsed out of `docs/player-data.md`; writes `jasons-cheat-sheet.user.js`.
- `jasons-cheat-sheet.user.js` — built output that Jason pastes into Tampermonkey. Commit it.
- `test/harness.js` — Node simulation (stub DOM, WebSocket, fetch); writes `test/panel.html`.
- `docs/` — copies of the claude.ai Project docs (strategy, draft plan, player data). Source of truth is the Project; recopy when they change.
  `player-data.md` is also a **build input** (its xRank column) — keep the table's `| xRk | Player | Pos | Tm | Flag | ADP |` column order or the build throws.

## Workflow
1. Edit `src/userscript.template.js`. Bump `// @version` every change.
2. `node build.js`
3. `node --check jasons-cheat-sheet.user.js && node test/harness.js` (prints `ok`; inspect `test/panel.html`).
4. Commit template and built file together. Keep `@name Jason's Cheat Sheet` and `@namespace jason.fantasyhoops` unchanged, or Tampermonkey installs a duplicate.

## How the script works
- Runs at `document-start`, `@grant none`, in the page world.
- Pick sync: wraps `WebSocket` and hooks `MessageEvent.prototype.data`; DOM fallback reads Yahoo's "Your Team" panel.
  Messages: `P|pick=playerId,team,x|...` (history), `0|pick|playerId|team|slot|x` (live pick),
  `D|pick|team|105` (on the clock), `R|t1|t2|...` (draft order).
- Players: `GET https://pub-api.fantasysports.yahoo.com/fantasy/v3/players/nba/{league}?format=rawjson&projected=1&average=1`
  with credentials (the same call Yahoo's draft client makes). Retries; expired mock drafts return 403.
  Fields: `id, fname, lname, team_abbr, display_pos, inj, average-pick, last7days-average-pick, percent-drafted, o_rank`.
  Stat maps `season_stats` (2025-26 totals), `projected_stats` (2026-27 totals), `average_stats`, keyed by stat id:
  0 GP, 3 FGA, 4 FGM, 5 FG%, 6 FTA, 7 FTM, 8 FT%, 10 3PM, 12 PTS, 15 REB, 16 AST, 17 STL, 18 BLK, 19 TO.
- Projection priority per player: Yahoo `projected_stats` (src `live`) → `proj.json` match by initial+last+team (src `saved`) → last season (src `last`).
- Team totals = per-game × GP; FG%/FT% from makes/attempts. Empty roster slots are filled with an average top-156 line for every team.
  Ranks are against the other 11 teams (TO: lower is better).
- `effectiveAdp` blends ADP with o_rank when percent-drafted is low (noisy ADP).
- Two separate numbers, deliberately not merged: **value** = `0.7 × xRank + 0.3 × effectiveAdp` (`p.value`, falls back to
  effectiveAdp below xRank ~150) orders Best available, the top-40 candidate pool, and search results; **timing** =
  `effectiveAdp` alone (`p.adp`) drives the Likely there / gone tags. Blending them would make each wrong for its own job
  (Kawhi: xRank 48, ADP 23 — a blend is too late to warn he's gone, too early to reflect his value).
  xRank and ADP correlate at r≈0.97, so the weight mostly matters for the ~20 players who diverge by 15+ picks.
- Value gap (`ADP − xRank`, shown as a `+n value` / `−n reach` badge when |gap| ≥ 8) is the one signal Yahoo's UI doesn't have.
- Best fit sorts by urgency tier first (won't last to your next turn → coin flip → he'll keep), then by fit score.
  A great fit you can still get at your next turn isn't worth spending this pick on; waiting gets you both. Players
  who'll keep are sorted down, never hidden — that a need can wait is itself useful. Early rounds are where this bites:
  at pick 12 the best fit in the pool often sits at ADP 38 and would otherwise top the list.
- Category bands (`band()`, one source of truth for colour *and* weight, so the panel can't label something "Consider"
  while the scoring still chases it): **1–3 double down** green ×0.5, **4–6 target** yellow ×1.0, **7–9 consider**
  orange ×0.75, **10–12 punt** red ×0.25. Consider isn't cut to punt levels because rank 7 is the tipping point —
  you lose it slightly more often than you win it, so a small push there is often the cheapest category win available.
- Each card shows two numbers in the Net box: raw rank places gained (big) over the weighted score the list is actually
  ordered by (small). They diverge — +3 in a locked category scores below +2 in a contested one — and hiding the second
  made the ordering look arbitrary.
- Three list modes: **Best fit** (rank change weighted by the bands above),
  **ADP** (pure market order), **Best available** (consensus value). The candidate pool is the top 60 by whichever key the
  mode sorts on — pooling by value while sorting by ADP would drop market darlings — and 20 are shown.
- Tags compare ADP to the pick Jason would wait for: gap ≥ 6 "Likely there", within ±6 "Maybe there", else "Likely gone";
  "Faller" when the player is still available 12+ picks past his ADP. On the clock that horizon is `myNextTurn` — the
  pick after his whole consecutive run, not the next pick that happens to be his. At a back-to-back (48/49) no one else
  picks in between, so measuring against 49 makes everything read "Likely there"; the real question is who survives to 72.
- UI: fixed panel, 497px wide, draggable (position saved in localStorage `fhPos`), minimize button.
- Green side rails run down the columns Jason already wins (band 0, rank ≤ 3), with a tinted header chip. Rails rather than a
  fill because the cell background already means "this player moves you up/down" — two meanings can't share it.
  Only the top band is railed: marking more bands marks most of the nine columns, which highlights nothing (mocked it
  up twice and both times the busier version lost).
  The point is reading a ▼ in context — an 82% FT shooter dilutes a category you're #3 in, but you still win it, so the
  red is noise. A rail says the drop is affordable.
- Pop out (⧉) moves the panel into its own window. Sync still runs in the draft tab — only that tab can see Yahoo's
  WebSocket — so the popup is purely a render target the draft tab paints into (`about:blank` inherits the opener's
  origin, so no messaging is needed). Two things this depends on: `schedule()` must use the **popup's** timers, since a
  hidden tab's are throttled to ~1/min after 5 minutes, and the popup also repaints itself once a second as a backstop;
  and the draft page's `beforeunload` closes the popup, so a reload can't leave an orphan window showing a frozen board.
  The inline overlay is hidden (not destroyed) while popped, and comes back when the popup closes.

## Rules
- Never make picks or click anything in Yahoo's draft room; the script is read-only.
- Don't hard-code league IDs; read them from the URL.
- Verify Yahoo field changes against a live draft room before relying on them.
