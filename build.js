// Build: node build.js  ->  jasons-cheat-sheet.user.js
const fs = require('fs');
const t = fs.readFileSync('src/userscript.template.js', 'utf8');
const proj = fs.readFileSync('src/proj.json', 'utf8');
if (!t.includes('__PROJ__')) throw new Error('template is missing __PROJ__ placeholder');
if (!t.includes('__VERSION__')) throw new Error('template is missing __VERSION__ placeholder');
const version = (t.match(/@version\s+(\S+)/) || [])[1];
if (!version) throw new Error('template is missing @version');
const out = t.replace('__PROJ__', proj).replace('__VERSION__', JSON.stringify(version));
fs.writeFileSync('jasons-cheat-sheet.user.js', out);
console.log('built jasons-cheat-sheet.user.js', version);
