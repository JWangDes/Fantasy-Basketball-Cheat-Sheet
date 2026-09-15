// Build: node build.js  ->  jasons-cheat-sheet.user.js
const fs = require('fs');
const t = fs.readFileSync('src/userscript.template.js', 'utf8');
const proj = fs.readFileSync('src/proj.json', 'utf8');
if (!t.includes('__PROJ__')) throw new Error('template is missing __PROJ__ placeholder');
fs.writeFileSync('jasons-cheat-sheet.user.js', t.replace('__PROJ__', proj));
console.log('built jasons-cheat-sheet.user.js', (t.match(/@version\s+(\S+)/) || [])[1]);
