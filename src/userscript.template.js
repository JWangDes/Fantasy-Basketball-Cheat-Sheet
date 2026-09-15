// ==UserScript==
// @name         Jason's Cheat Sheet
// @namespace    jason.fantasyhoops
// @version      1.11
// @description  Live 9-cat category ranks and pick suggestions inside the Yahoo draft room
// @match        https://basketball.fantasysports.yahoo.com/draftclient/*
// @run-at       document-start
// @grant        none
// @updateURL    https://raw.githubusercontent.com/JWangDes/Fantasy-Basketball-Cheat-Sheet/main/jasons-cheat-sheet.user.js
// @downloadURL  https://raw.githubusercontent.com/JWangDes/Fantasy-Basketball-Cheat-Sheet/main/jasons-cheat-sheet.user.js
// ==/UserScript==
(function () {
  'use strict';
  if (window.__fhOverlay) return; window.__fhOverlay = true;

  // ---------- 2026-27 projections: [name, team, pos, [GP,FG%,FT%,3PM,PTS,REB,AST,STL,BLK,TO]] ----------
  const PROJ = __PROJ__;
  const CURRENT_VERSION = __VERSION__;
  const RAW_URL = 'https://raw.githubusercontent.com/JWangDes/Fantasy-Basketball-Cheat-Sheet/main/jasons-cheat-sheet.user.js';

  const CATS = ['FG%', 'FT%', '3PM', 'PTS', 'REB', 'AST', 'STL', 'BLK', 'TO'];
  const ROSTER = 13;
  const m = location.pathname.match(/draftclient\/nba\/(\d+)\/(\d+)/);
  const LEAGUE = m ? m[1] : null, MY_TEAM = m ? +m[2] : null;

  const S = { picks: new Map(), onClock: null, order: [], players: new Map(), ready: false, err: null, mode: 'fit', collapsed: false, query: '', newVersion: null };

  // ---------- 0. check GitHub for a newer version as soon as the draft room opens ----------
  async function checkForUpdate() {
    try {
      const r = await fetch(RAW_URL + '?t=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) return;
      const text = await r.text();
      const v = (text.match(/@version\s+(\S+)/) || [])[1];
      if (v && v !== CURRENT_VERSION) { S.newVersion = v; schedule(); }
    } catch (e) {} // offline / blocked: silently skip, Tampermonkey's own periodic check still applies
  }

  // ---------- 1. listen to the draft server ----------
  function handle(line) {
    const p = line.split('|');
    switch (p[0]) {
      case 'P': // pick history on connect: P|pick=playerId,team,x|...
        p.slice(1).forEach(s => { const [pk, rest] = s.split('='); if (!rest) return; const [pid, tm] = rest.split(','); S.picks.set(+pk, { pid: +pid, team: +tm }); });
        break;
      case '0': // live pick: 0|pick|playerId|team|slot|x
        S.picks.set(+p[1], { pid: +p[2], team: +p[3] }); break;
      case 'D': S.onClock = { pick: +p[1], team: +p[2] }; break;
      case 'R': S.order = p.slice(1).map(Number); break;
      default: return;
    }
    schedule();
  }

  // Three independent ways to see picks, so one failing doesn't break sync.
  const W0 = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;
  const seen = new WeakSet();
  const feed = (ev) => {
    try {
      if (!ev || seen.has(ev)) return; seen.add(ev);
      const v = ev.__fhData !== undefined ? ev.__fhData : ev.data;
      if (typeof v === 'string') v.split('\n').forEach(l => { try { handle(l.trim()); } catch (e) {} });
    } catch (e) {}
  };
  // (a) wrap the WebSocket constructor so every new socket reports to us
  try {
    const NativeWS = W0.WebSocket;
    const Wrapped = function (url, protocols) {
      const ws = protocols === undefined ? new NativeWS(url) : new NativeWS(url, protocols);
      try { ws.addEventListener('message', feed); } catch (e) {}
      S.sockets = (S.sockets || 0) + 1;
      return ws;
    };
    Wrapped.prototype = NativeWS.prototype;
    ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'].forEach(k => { try { Wrapped[k] = NativeWS[k]; } catch (e) {} });
    W0.WebSocket = Wrapped;
  } catch (e) {}
  // (b) catch messages as the page reads them (covers sockets opened before this script ran)
  function hookData() {
    try {
      const proto = W0.MessageEvent.prototype;
      const cur = Object.getOwnPropertyDescriptor(proto, 'data');
      if (!cur || !cur.get || cur.get.__fh) return;
      const orig = cur.get;
      const g = function () {
        const v = orig.call(this);
        try { if (typeof v === 'string' && this.target && this.target.constructor && /WebSocket/.test(this.target.constructor.name || '') && !seen.has(this)) { seen.add(this); v.split('\n').forEach(l => { try { handle(l.trim()); } catch (e) {} }); } } catch (e) {}
        return v;
      };
      g.__fh = true;
      Object.defineProperty(proto, 'data', { configurable: true, enumerable: cur.enumerable, get: g });
    } catch (e) {}
  }
  hookData(); setInterval(hookData, 3000);

  // ---------- 2. load Yahoo's player list (ids, names, ADP, last season FGA/FTA) ----------
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[.']/g, '').replace(/\s+(jr|sr|ii|iii|iv)$/, '').trim();
  const keyOf = (initial, last) => norm(initial)[0] + ' ' + norm(last);

  // ADP from a handful of drafts is noise (a 2%-drafted player can show ADP 44). Trust it in proportion to how often he's drafted.
  function effectiveAdp(y) {
    const num = v => { const n = parseFloat(v); return n > 0 ? n : null; };
    const adp = num(y['last7days-average-pick']) || num(y['average-pick']);
    const pct = parseFloat(y['percent-drafted']) || 0;
    const rank = num(y.o_rank) || 400;
    if (!adp) return Math.max(rank, 150);
    if (pct >= 0.6) return adp;
    const floor = Math.max(rank, 140);          // rarely drafted: fall back toward Yahoo's overall rank
    return adp * pct + Math.max(adp, floor) * (1 - pct);
  }

  async function loadPlayers(attempt = 1) {
    try {
      const API = `https://pub-api.fantasysports.yahoo.com/fantasy/v3/players/nba/${LEAGUE}?format=rawjson`;
      let r = await fetch(API + '&projected=1&average=1', { credentials: 'include' }); // same call Yahoo's draft room makes
      if (!r.ok) r = await fetch(API, { credentials: 'include' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const list = (await r.json()).service.player_list;
      const projByKey = new Map(); // "initial last|TEAM" -> [[pos, projection], ...]
      PROJ.forEach(([n, tm, pos, pr]) => {
        const [ini, ...rest] = n.split(' ');
        const k = keyOf(ini, rest.join(' ')) + '|' + tm;
        (projByKey.get(k) || projByKey.set(k, []).get(k)).push([pos, pr]);
      });
      list.forEach(y => {
        const ss = y.season_stats || {}; const num = k => parseFloat(ss[k]);
        const cands = projByKey.get(keyOf(y.fname || '?', y.lname || '') + '|' + y.team_abbr) || [];
        const hit = cands.length === 1 ? cands[0] : cands.find(c => c[0] === y.display_pos); // same name + team: match by position
        const pr = hit ? hit[1] : null;
        const lastGP = num('0') || 0;
        const ps = y.projected_stats || {}; const pj = k => parseFloat(ps[k]); const pGP = pj('0') || 0;
        // per-game line: Yahoo live 2026-27 projections > saved projections > last season
        let line = null, src = 'last';
        if (pGP > 0 && pj('12') >= 0) {
          line = { gp: pGP, fgp: pj('5'), ftp: pj('8'), tpm: pj('10') / pGP, pts: pj('12') / pGP, reb: pj('15') / pGP, ast: pj('16') / pGP, stl: pj('17') / pGP, blk: pj('18') / pGP, to: pj('19') / pGP,
            fga: pj('3') / pGP, fta: pj('6') / pGP };
          if (!(line.fga > 0)) delete line.fga;
          if (!(line.fta > 0)) delete line.fta;
          src = 'live';
        } else if (pr) { src = 'saved'; line = { gp: pr[0], fgp: pr[1], ftp: pr[2], tpm: pr[3], pts: pr[4], reb: pr[5], ast: pr[6], stl: pr[7], blk: pr[8], to: pr[9] }; }
        if (!line && lastGP > 10) line = { gp: lastGP, fgp: num('5'), ftp: num('8'), tpm: num('10') / lastGP, pts: num('12') / lastGP, reb: num('15') / lastGP, ast: num('16') / lastGP, stl: num('17') / lastGP, blk: num('18') / lastGP, to: num('19') / lastGP };
        if (line && line.fga !== undefined && line.fta !== undefined) { /* real projected attempts */ }
        else if (line) {
          // shot attempts per game: last season's real rate, scaled to projected scoring
          if (lastGP > 10 && num('3') > 0 && num('12') > 0) {
            const scale = line.pts / (num('12') / lastGP);
            line.fga = num('3') / lastGP * scale; line.fta = num('6') / lastGP * scale;
          } else { // no history: estimate from points
            const ftm = 0.18 * line.pts; line.fta = ftm / (line.ftp || 0.78); line.fga = Math.max(0.5, (line.pts - line.tpm - ftm) / 2) / (line.fgp || 0.46);
          }
        }
        if (line) ['fgp', 'ftp'].forEach(f => { if (!(line[f] > 0)) line[f] = f === 'fgp' ? 0.46 : 0.78; });
        S.players.set(+y.id, {
          id: +y.id, name: `${(y.fname || '')[0] || ''}. ${y.lname}`, full: `${y.fname} ${y.lname}`, team: y.team_abbr, pos: y.display_pos || '',
          inj: y.inj || '', adp: effectiveAdp(y), line, src
        });
      });
      buildBaseline(); S.ready = true;
    } catch (e) {
      if (attempt < 6) { S.err = `Loading players (retry ${attempt})…`; setTimeout(() => loadPlayers(attempt + 1), 3000); }
      else S.err = 'Could not load Yahoo player data (' + (e.message || e) + '). Refresh the draft page.';
    }
    schedule();
  }

  // (c) fallback: read your roster straight from Yahoo's "YOUR TEAM" panel
  const DOM_MINE = new Set();
  function readYourTeamPanel() {
    if (!S.ready) return;
    try {
      const hdr = [...document.querySelectorAll('body *')].find(e => /^YOUR TEAM \(\d+\/\d+\)$/i.test((e.textContent || '').trim()) && e.children.length < 3);
      if (!hdr) return;
      let box = hdr; for (let i = 0; i < 4 && box && !/BN/.test(box.innerText || ''); i++) box = box.parentElement;
      if (!box) return;
      const txt = box.innerText || '';
      const re = /([A-Z][A-Za-z'’\-]*)\.\s+([^\n]+?)\s*\n\s*[A-Z,]+\s*[•·]\s*([A-Z]{2,4})/g;
      let mm, found = new Set();
      while ((mm = re.exec(txt))) {
        const k = keyOf(mm[1], mm[2]); const team = mm[3];
        const hit = [...S.players.values()].find(p => keyOf(p.name.split('.')[0], p.name.split('. ').slice(1).join('. ')) === k && p.team === team);
        if (hit) found.add(hit.id);
      }
      let changed = found.size !== DOM_MINE.size || [...found].some(id => !DOM_MINE.has(id));
      if (changed) { DOM_MINE.clear(); found.forEach(id => DOM_MINE.add(id)); schedule(); }
    } catch (e) {}
  }
  setInterval(readYourTeamPanel, 2000);

  // ---------- 3. team totals and category ranks ----------
  let AVG = null; // average drafted player (top 156 by ADP) used to fill empty roster spots
  function buildBaseline() {
    const pool = [...S.players.values()].filter(p => p.line).sort((a, b) => a.adp - b.adp).slice(0, 156);
    const keys = ['gp', 'fgp', 'ftp', 'tpm', 'pts', 'reb', 'ast', 'stl', 'blk', 'to', 'fga', 'fta'];
    AVG = {}; keys.forEach(k => AVG[k] = pool.reduce((s, p) => s + p.line[k], 0) / pool.length);
  }
  function totals(lines) {
    const all = lines.slice(0, ROSTER); while (all.length < ROSTER) all.push(AVG);
    const t = { fgm: 0, fga: 0, ftm: 0, fta: 0, tpm: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0 };
    all.forEach(l => {
      const g = l.gp;
      t.fga += l.fga * g; t.fgm += l.fga * l.fgp * g; t.fta += l.fta * g; t.ftm += l.fta * l.ftp * g;
      ['tpm', 'pts', 'reb', 'ast', 'stl', 'blk', 'to'].forEach(k => t[k] += l[k] * g);
    });
    return [t.fgm / t.fga, t.ftm / t.fta, t.tpm, t.pts, t.reb, t.ast, t.stl, t.blk, t.to];
  }
  function rosters() {
    const R = new Map(); for (let t = 1; t <= 12; t++) R.set(t, []);
    [...S.picks.entries()].sort((a, b) => a[0] - b[0]).forEach(([, v]) => {
      const p = S.players.get(v.pid); if (!R.has(v.team)) R.set(v.team, []);
      R.get(v.team).push(p && p.line ? p.line : AVG);
    });
    const socketMine = [...S.picks.values()].filter(v => v.team === MY_TEAM).length;
    if (DOM_MINE.size > socketMine) R.set(MY_TEAM, [...DOM_MINE].map(id => { const p = S.players.get(id); return p && p.line ? p.line : AVG; }));
    return R;
  }
  function rankOf(myVals, others, c) {
    const better = others.filter(o => c === 8 ? o[c] < myVals[c] : o[c] > myVals[c]).length;
    return better + 1;
  }
  function analyze(extraLine) {
    const R = rosters();
    const mine = (R.get(MY_TEAM) || []).slice(); if (extraLine) mine.push(extraLine);
    const my = totals(mine);
    const others = [...R.entries()].filter(([t]) => t !== MY_TEAM).map(([, ls]) => totals(ls));
    return { my, ranks: CATS.map((_, c) => rankOf(my, others, c)), count: (R.get(MY_TEAM) || []).length };
  }

  // ---------- 4. suggestions ----------
  const W = r => r <= 4 ? 0.5 : r <= 8 ? 1 : 0.25; // double down / target / punt
  function availablePlayers() {
    const taken = new Set([...S.picks.values()].map(v => v.pid).concat([...DOM_MINE]));
    return [...S.players.values()].filter(p => p.line && !taken.has(p.id));
  }
  // how adding this player would move each of your category ranks, vs. base (your current roster)
  function evaluate(p, base) {
    const a = analyze(p.line); let score = 0; const moves = [];
    CATS.forEach((c, i) => { const d = base.ranks[i] - a.ranks[i]; score += d * W(base.ranks[i]); if (d !== 0) moves.push([c, base.ranks[i], a.ranks[i], d]); });
    return { score, moves };
  }
  function suggestions(base) {
    const avail = availablePlayers().sort((a, b) => a.adp - b.adp);
    return avail.slice(0, 40).map(p => ({ p, ...evaluate(p, base) }))
      .sort((x, y) => S.mode === 'bpa' ? x.p.adp - y.p.adp : (y.score - x.score || x.p.adp - y.p.adp)).slice(0, 10);
  }
  const searchNorm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  function searchResults(base) {
    const q = searchNorm(S.query.trim()); if (!q) return [];
    return availablePlayers().filter(p => searchNorm(p.full + ' ' + p.name).includes(q))
      .sort((a, b) => a.adp - b.adp).slice(0, 15).map(p => ({ p, ...evaluate(p, base) }));
  }
  function myPickAfter(n) { // first of my picks with number > n
    if (!S.order.length) return null;
    for (let i = n; i < S.order.length; i++) if (S.order[i] === MY_TEAM) return i + 1;
    return null;
  }
  function myNextPick() {
    const cur = S.onClock ? S.onClock.pick : S.picks.size + 1;
    if (S.order.length) { for (let i = cur - 1; i < S.order.length; i++) if (S.order[i] === MY_TEAM) return i + 1; }
    return null;
  }

  // ---------- 5. overlay UI ----------
  const CSS = `
  #fh{position:fixed;right:16px;bottom:16px;width:497px;max-height:calc(100vh - 32px);overflow:auto;z-index:2147483000;
    background:#101418;color:#e9edf1;border:1px solid #2a323b;border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.5);
    font:14px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-variant-numeric:tabular-nums}
  #fh *{box-sizing:border-box}
  #fh .hd{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border-bottom:1px solid #2a323b;cursor:move;user-select:none}
  #fh .ttl{font-weight:700;font-size:15px;letter-spacing:.3px}#fh .ttl b{color:#e8a54c}
  #fh .sub{color:#9aa4af;font-size:13.5px}
  #fh button{font:inherit;font-size:13.5px;color:#e9edf1;background:#1b2128;border:1px solid #2f3842;border-radius:6px;padding:4px 10px;cursor:pointer}
  #fh button:focus-visible{outline:2px solid #e8a54c;outline-offset:1px}
  #fh button.ic{width:30px;height:30px;padding:0;display:grid;place-items:center;border-radius:8px}
  #fh .seg{display:flex}#fh .seg button{border-radius:0}#fh .seg button:first-child{border-radius:6px 0 0 6px}#fh .seg button:last-child{border-radius:0 6px 6px 0;border-left:none}
  #fh button.on{background:#e8a54c;color:#1b1207;border-color:#e8a54c;font-weight:600}
  #fh .bd{padding:10px 12px;display:flex;flex-direction:column;gap:12px}
  #fh .grid{margin-top:6px}#fh .row{display:grid;grid-template-columns:44px 1fr 70px;gap:8px;align-items:center;padding:5px 0;border-bottom:1px solid #2c333c}#fh .row:last-child{border-bottom:none}
  #fh .cn{font-weight:600}
  #fh .val{color:#b4bcc6}
  #fh .rk{text-align:center;font-weight:700;border-radius:5px;padding:2px 0}
  #fh .g{background:#14301d;color:#6fd184}#fh .o{background:#35240f;color:#f0a04b}#fh .r{background:#361714;color:#ee7a6c}
  #fh .gt{color:#6fd184}#fh .ot{color:#f0a04b}#fh .rt{color:#ee7a6c}
  #fh .sec{font-size:13.5px;text-transform:uppercase;letter-spacing:.06em;color:#9aa4af;display:flex;justify-content:space-between;align-items:center;gap:8px}
  #fh .legend{color:#9aa4af;font-size:13.5px;margin:6px 0 4px}
  #fh .strip{display:grid;grid-template-columns:38px repeat(9,1fr);gap:3px;align-items:stretch;margin-top:4px}
  #fh .strip.hdr span{text-align:center;font-size:13.5px;font-weight:700}
  #fh .cell,#fh .net{text-align:center;font-size:13.5px;font-weight:700;border-radius:4px;padding:3px 0;display:flex;flex-direction:column;justify-content:center;line-height:1.2}
  #fh .cell b{font-weight:600;color:#e9edf1}#fh .cell i{font-style:normal;font-weight:700}
  #fh .cell.nt{background:#161b21}#fh .cell.nt i{color:#4a535d}
  #fh .cell.up,#fh .net.up{background:#14301d;color:#6fd184}#fh .cell.dn,#fh .net.dn{background:#361714;color:#ee7a6c}
  #fh .net.nt{color:#9aa4af;background:#1b2128}
  #fh .up{color:#6fd184}#fh .dn{color:#ee7a6c}
  #fh .s{padding:8px 0;border-top:1px solid #222a32}
  #fh .top{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
  #fh .nm{font-weight:650;font-size:14.5px}#fh .meta{color:#9aa4af;font-size:13.5px}
  #fh .tag{font-size:13px;font-weight:600;border-radius:4px;padding:1px 6px;white-space:nowrap}
  #fh .q:focus-visible{outline:2px solid #e8a54c}
  #fh .strip.hdr .nh{color:#9aa4af;font-size:12px;font-weight:600}#fh .tag.fall{background:#10283a;color:#6cb8f0}
  #fh .tag.safe{background:#14301d;color:#6fd184}#fh .tag.flip{background:#35240f;color:#f0a04b}#fh .tag.gone{background:#361714;color:#ee7a6c}
  #fh .inj{background:#361714;color:#ee7a6c;border-radius:3px;padding:0 5px;font-size:13px;margin-left:6px}
  #fh.min{width:auto}#fh.min .bd{display:none}#fh.min .hd{border-bottom:none}
  #fh input[type=search]{width:100%;background:#161b21;border:1px solid #2f3842;border-radius:6px;color:#e9edf1;padding:6px 10px;font:inherit;font-size:13.5px;margin-top:6px}
  #fh input[type=search]::placeholder{color:#5c6672}
  #fh input[type=search]:focus-visible{outline:2px solid #e8a54c;outline-offset:1px}
  #fh .empty{color:#9aa4af;font-size:13.5px;padding:8px 0}
  #fh .upd{display:inline-block;margin-top:5px;color:#1b1207;background:#e8a54c;font-weight:700;font-size:12.5px;padding:2px 7px;border-radius:4px;text-decoration:none}
  #fh .upd:hover{filter:brightness(1.08)}`;
  let root, dirty = false;
  function schedule() { if (!dirty) { dirty = true; setTimeout(render, 150); } }
  function mount() {
    if (root || !document.body) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    root = document.createElement('div'); root.id = 'fh'; document.body.appendChild(root);
    root.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.mode) { S.mode = b.dataset.mode; render(); }
      if (b.dataset.act === 'min') { S.collapsed = !S.collapsed; render(); }
    });
    root.addEventListener('input', e => {
      if (e.target && e.target.id === 'fh-search') { S.query = e.target.value; render(); }
    });
    // drag
    let drag = null;
    root.addEventListener('mousedown', e => { if (!e.target.closest('.hd') || e.target.closest('button')) return; const r = root.getBoundingClientRect(); drag = { dx: e.clientX - r.left, dy: e.clientY - r.top }; e.preventDefault(); });
    window.addEventListener('mousemove', e => { if (!drag) return; root.style.left = Math.max(0, e.clientX - drag.dx) + 'px'; root.style.top = Math.max(0, e.clientY - drag.dy) + 'px'; root.style.right = 'auto'; root.style.bottom = 'auto'; });
    window.addEventListener('mouseup', () => { if (drag) { try { localStorage.setItem('fhPos', JSON.stringify({ l: root.style.left, t: root.style.top })); } catch (e) {} } drag = null; });
    try { const pos = JSON.parse(localStorage.getItem('fhPos') || 'null'); if (pos && pos.l) { root.style.left = pos.l; root.style.top = pos.t; root.style.right = 'auto'; root.style.bottom = 'auto'; } } catch (e) {}
    render();
  }
  const fmt = (c, v) => c < 2 ? v.toFixed(3).replace(/^0/, '') : Math.round(v).toLocaleString();
  const cls = r => r <= 4 ? 'g' : r <= 8 ? 'o' : 'r';
  const label = r => r <= 4 ? 'Double down' : r <= 8 ? 'Target' : 'Punt';
  const SHORT = ['FG', 'FT', '3P', 'PT', 'RB', 'AS', 'ST', 'BK', 'TO'];
  const ICON_MIN = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const ICON_MAX = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4 10l4-4 4 4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const escHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function playerCard(p, moves, cur, next) {
    const byCat = {}; (moves || []).forEach(x => byCat[x[0]] = x);
    const net = (moves || []).reduce((s, x) => s + x[3], 0);
    const L = p.line;
    const vals = [L.fgp, L.ftp, L.tpm, L.pts, L.reb, L.ast, L.stl, L.blk, L.to]; // per game (projected season ÷ projected games)
    const fv = (i, v) => i < 2 ? v.toFixed(3).replace(/^0/, '') : v.toFixed(1);
    const cells = `<div class="strip">${'<span class="net ' + (net > 0 ? 'up' : net < 0 ? 'dn' : 'nt') + '">' + (net > 0 ? '+' : '') + net + '</span>'}${CATS.map((c, i) => {
      const x = byCat[c]; const d = x ? x[3] : 0;
      const title = `${c}: ${fv(i, vals[i])} per game${x ? ` · your rank #${x[1]} → #${x[2]}` : ' · no rank change'}`;
      return `<span class="cell ${d > 0 ? 'up' : d < 0 ? 'dn' : 'nt'}" title="${title}"><b>${fv(i, vals[i])}</b><i>${d > 0 ? '▲' + d : d < 0 ? '▼' + (-d) : '–'}</i></span>`;
    }).join('')}</div>`;
    // Will he still be there? Compare his ADP to the pick you'd wait for.
    const mineNow = S.onClock && S.onClock.team === MY_TEAM;
    const waitPick = mineNow ? myPickAfter(cur) : next;   // on the clock: your following pick; otherwise: your next pick
    let tag = '';
    if (p.adp < cur - 12) tag = `<span class="tag fall">Faller</span>`;
    else if (waitPick) {
      const gap = p.adp - waitPick;
      if (gap >= 6) tag = `<span class="tag safe">Likely there</span>`;
      else if (gap >= -6) tag = `<span class="tag flip">Maybe there</span>`;
      else tag = `<span class="tag gone">Likely gone</span>`;
    }
    return `<div class="s"><div class="top"><div><span class="nm">${p.name}</span>${p.inj ? `<span class="inj">${p.inj}</span>` : ''}<div class="meta">${p.pos} · ${p.team}${p.src === 'live' ? '' : p.src === 'saved' ? ' · saved proj' : ' · last season'} · ADP ${p.adp < 900 ? p.adp.toFixed(0) : '–'}</div></div>${tag}</div>${cells}</div>`;
  }
  function render() {
    dirty = false; if (!root) return;
    // an innerHTML rewrite drops focus/cursor, so save and restore them around it if the search box is active
    const active = root.contains(document.activeElement) ? document.activeElement : null;
    const searchFocused = active && active.id === 'fh-search';
    const selStart = searchFocused ? active.selectionStart : null, selEnd = searchFocused ? active.selectionEnd : null;

    root.classList.toggle('min', S.collapsed);
    const next = myNextPick();
    const cur = S.onClock ? S.onClock.pick : S.picks.size + 1;
    const status = `${S.picks.size ? S.picks.size + ' picks' : (DOM_MINE.size ? 'your roster only' : '0 picks')}${S.onClock ? ` · #${S.onClock.pick} on clock` : ''}${next ? ` · you #${next}` : ''}${S.ready ? '' : ' · ' + (S.err || 'loading…')}`;
    const updateBanner = S.newVersion ? `<a class="upd" href="${RAW_URL}" target="_blank" rel="noopener">v${escHtml(S.newVersion)} available — click to update</a>` : '';
    const head = `<div class="hd"><div><div class="ttl">Jason's <b>Cheat Sheet</b></div><div class="sub">${status}</div>${updateBanner}</div><button class="ic" data-act="min" title="${S.collapsed ? 'Expand' : 'Minimize'}" aria-label="${S.collapsed ? 'Expand' : 'Minimize'}">${S.collapsed ? ICON_MAX : ICON_MIN}</button></div>`;
    if (!S.ready || !AVG) { root.innerHTML = head; return; }
    const base = analyze();
    const grid = CATS.map((c, i) => `<div class="row"><span class="cn">${c}</span><span class="val">${fmt(i, base.my[i])}</span><span class="rk ${cls(base.ranks[i])}" >#${base.ranks[i]}</span></div>`).join('');
    const colHead = `<div class="strip hdr"><span class="nh" title="Net rank change across all 9 categories">Net</span>${SHORT.map((s, i) => `<span class="${cls(base.ranks[i])}t">${s}</span>`).join('')}</div>`;
    const sug = suggestions(base).map(({ p, moves }) => playerCard(p, moves, cur, next)).join('');
    const q = S.query.trim();
    const results = q ? searchResults(base) : [];
    const searchBody = !q ? '' : results.length
      ? colHead + results.map(({ p, moves }) => playerCard(p, moves, cur, next)).join('')
      : `<div class="empty">No available players match "${escHtml(q)}".</div>`;
    root.innerHTML = head + `<div class="bd">
      <div><div class="sec"><span>Category ranks (of 12)</span><span>${base.count}/13</span></div>
      <div class="grid">${grid}</div></div>
      <div><div class="sec"><span>Search players</span></div>
      <input id="fh-search" type="search" autocomplete="off" placeholder="Player name…" value="${escHtml(S.query)}">
      ${searchBody}</div>
      <div><div class="sec"><span>Next pick</span><span class="seg"><button data-mode="fit" class="${S.mode === 'fit' ? 'on' : ''}">Best fit</button><button data-mode="bpa" class="${S.mode === 'bpa' ? 'on' : ''}">Best available</button></span></div>
      ${colHead}${sug}</div></div>`;

    if (searchFocused) {
      const inp = root.querySelector('#fh-search');
      if (inp) { inp.focus(); try { inp.setSelectionRange(selStart, selEnd); } catch (e) {} }
    }
  }

  checkForUpdate();
  // wait for the draft room to finish its own login handshake before asking for player data
  setTimeout(() => loadPlayers(), 2500);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
  setInterval(() => { if (!root) mount(); }, 2000);
})();
