// Build: node build.js  ->  jasons-cheat-sheet.user.js
const fs = require('fs');
const t = fs.readFileSync('src/userscript.template.js', 'utf8');
const proj = fs.readFileSync('src/proj.json', 'utf8');
if (!t.includes('__PROJ__')) throw new Error('template is missing __PROJ__ placeholder');
if (!t.includes('__VERSION__')) throw new Error('template is missing __VERSION__ placeholder');
if (!t.includes('__XRANK__')) throw new Error('template is missing __XRANK__ placeholder');
const version = (t.match(/@version\s+(\S+)/) || [])[1];
if (!version) throw new Error('template is missing @version');

// xRank rides along in proj.json as a 5th field, so one file carries all player data and the build
// doesn't depend on the docs table's column order. Players outside the consensus top ~190 have null.
const xrank = JSON.parse(proj).filter(p => p[4] != null).map(p => [p[0], p[1], p[2], p[4]]);
if (xrank.length < 100) throw new Error(`only ${xrank.length} players carry an xRank in src/proj.json — did the file lose its 5th field?`);

const out = t.replace('__PROJ__', proj).replace('__VERSION__', JSON.stringify(version))
  .replace('__XRANK__', JSON.stringify(xrank));
fs.writeFileSync('jasons-cheat-sheet.user.js', out);
console.log('built jasons-cheat-sheet.user.js', version, `(${xrank.length} xRanks)`);
