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
- `build.js` — replaces `__PROJ__` with proj.json and `__VERSION__` with the template's `@version`, writes `jasons-cheat-sheet.user.js`.
- `jasons-cheat-sheet.user.js` — built output that Jason pastes into Tampermonkey. Commit it.
- `test/harness.js` — Node simulation (stub DOM, WebSocket, fetch); writes `test/panel.html`.
- `docs/` — copies of the claude.ai Project docs (strategy, draft plan, player data). Source of truth is the Project; recopy when they change.

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
- Best fit: rank change weighted ×0.5 for categories ranked 1–4, ×1 for 5–8, ×0.25 for 9–12. Candidates are the top 40 by effective ADP; show 10.
- Tags compare ADP to Jason's next pick: gap ≥ 6 "Likely there", within ±6 "Maybe there", else "Likely gone";
  "Faller" when the player is still available 12+ picks past his ADP.
- UI: fixed panel, 497px wide, draggable (position saved in localStorage `fhPos`), minimize button.

## Rules
- Never make picks or click anything in Yahoo's draft room; the script is read-only.
- Don't hard-code league IDs; read them from the URL.
- Verify Yahoo field changes against a live draft room before relying on them.
