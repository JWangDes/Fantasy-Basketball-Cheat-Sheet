// Build: node build.js  ->  jasons-cheat-sheet.user.js
const fs = require('fs');
const t = fs.readFileSync('src/userscript.template.js', 'utf8');
const proj = fs.readFileSync('src/proj.json', 'utf8');
if (!t.includes('__PROJ__')) throw new Error('template is missing __PROJ__ placeholder');
if (!t.includes('__VERSION__')) throw new Error('template is missing __VERSION__ placeholder');
if (!t.includes('__XRANK__')) throw new Error('template is missing __XRANK__ placeholder');
const version = (t.match(/@version\s+(\S+)/) || [])[1];
if (!version) throw new Error('template is missing @version');

// xRank (multi-source consensus rank) comes from the docs table, so a recopied doc updates it automatically.
// Row shape: | xRk | Player | Pos | Tm | Flag | ADP | 26-27 P | ...
const xrank = [];
for (const line of fs.readFileSync('docs/player-data.md', 'utf8').split('\n')) {
  if (!line.startsWith('|') || !line.includes('26-27 P')) continue;
  const c = line.split('|').map(s => s.trim());
  const xr = parseFloat(c[1]);
  if (!(xr > 0)) continue;
  xrank.push([c[2].replace(/\s*\(R\)\s*$/, ''), c[4], xr]);
}
if (xrank.length < 100) throw new Error(`only parsed ${xrank.length} xRanks from docs/player-data.md — has the table format changed?`);

const out = t.replace('__PROJ__', proj).replace('__VERSION__', JSON.stringify(version))
  .replace('__XRANK__', JSON.stringify(xrank));
fs.writeFileSync('jasons-cheat-sheet.user.js', out);
console.log('built jasons-cheat-sheet.user.js', version, `(${xrank.length} xRanks)`);
