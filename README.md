# Jason's Cheat Sheet

Tampermonkey userscript that adds a live overlay to the Yahoo Fantasy Basketball draft room (H2H 9-cat).

## What it does
- Syncs every pick live from Yahoo's draft room connection.
- Loads Yahoo's live 2026-27 projections (falls back to saved projections, then last season).
- Shows your category ranks (#1–12) against the other 11 teams' actual rosters.
- Suggests your next pick: **Best fit** (moves your middle categories most) or **Best available** (by ADP).
- Tags each suggestion: **Likely there**, **Maybe there**, **Likely gone** for your next pick, or **Faller** (12+ picks past ADP).

## Install
1. Install Tampermonkey in Chrome and turn on **Allow User Scripts** for the extension.
2. Tampermonkey → Dashboard → **+** → replace everything with `jasons-cheat-sheet.user.js` → Save.
3. Open a draft at `basketball.fantasysports.yahoo.com/draftclient/*`.

## Version
1.9
