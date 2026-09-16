const fs=require('fs');
const code=fs.readFileSync('jasons-cheat-sheet.user.js','utf8');
class ET{constructor(){this.l={}} addEventListener(t,f){(this.l[t]=this.l[t]||[]).push(f)} emit(t,e){(this.l[t]||[]).forEach(f=>f(e))}}
class WebSocket extends ET{constructor(u){super();this.url=u}}
class MessageEvent{constructor(target,d){this._d=d;this.target=target}}
Object.defineProperty(MessageEvent.prototype,'data',{configurable:true,get(){return this._d}});
const els=[];let css='';
global.window=global; global.WebSocket=WebSocket; global.MessageEvent=MessageEvent;
global.location={pathname:'/draftclient/nba/1/12'};
global.localStorage={getItem(){return null},setItem(){}};
const mkEl=d=>{const l={};return {style:{},classList:{toggle(){},add(){},remove(){}},addEventListener(t,f){(l[t]=l[t]||[]).push(f)},_emit(t,e){(l[t]||[]).forEach(f=>f(e))},contains(){return false},querySelector(){return null},ownerDocument:d,set textContent(v){css=v},set innerHTML(v){this._h=v},get innerHTML(){return this._h}}};
const mkDoc=sink=>{const d={readyState:'complete',activeElement:null,head:{appendChild(){}},body:{style:{},appendChild(e){sink.push(e)},contains:e=>sink.includes(e)},querySelectorAll:()=>[],addEventListener(){}};d.createElement=()=>mkEl(d);return d};
global.document=mkDoc(els);
global.addEventListener=()=>{};
// popped-out window: its own document, its own (unthrottled) timers
const popEls=[];let popWin=null;
global.open=()=>{const l={};popWin={closed:false,document:mkDoc(popEls),setTimeout:(f,ms)=>setTimeout(f,ms),setInterval:()=>0,
  addEventListener(t,f){(l[t]=l[t]||[]).push(f)},_emit(t,e){(l[t]||[]).forEach(f=>f(e))},close(){this.closed=true}};return popWin};
const proj=JSON.parse(fs.readFileSync('src/proj.json','utf8'));
const pkey=r=>{const [ini,...rest]=r[0].split(' ');return ini[0].toLowerCase()+' '+rest.join(' ').toLowerCase()+'|'+r[1]};
const head=proj.slice(0,160), seenKeys=new Set(head.map(pkey));
// pull in same-name teammates from further down (e.g. Jaylin Williams at 201) so the fixture has the real collisions
const players=[...head,...proj.slice(160).filter(r=>seenKeys.has(pkey(r)))].map((r,i)=>{const [ini,...rest]=r[0].split(' ');return {id:i+1,fname:ini.replace('.','')+'x',lname:rest.join(' '),team_abbr:r[1],display_pos:r[2],inj:i%17==0?'GTD':'','average-pick':String(i==50?20:i==60?120:i+1),'percent-drafted':i==40?'0.02':'1.0',o_rank:i+1,season_stats:{},projected_stats:(i%2?{}:(()=>{const p=r[3]||[],g=p[0]||70;const fga=15*g,fta=5*g;return {0:g,3:fga,4:fga*(p[1]||.47),5:p[1],6:fta,7:fta*(p[2]||.78),8:p[2],10:p[3]*g,12:p[4]*g,15:p[5]*g,16:p[6]*g,17:p[7]*g,18:p[8]*g,19:p[9]*g}})())}});
// the real collision: Jalen (SF,PF) and Jaylin (PF,C) Williams are both "J. Williams|OKC", but only the
// starter is in the xRank table — the backup must not inherit his rank or his projection
const jalen=players.find(p=>p.lname==='Williams'&&p.team_abbr==='OKC'&&p.display_pos==='SF,PF');
const jaylin=players.find(p=>p.lname==='Williams'&&p.team_abbr==='OKC'&&p.display_pos==='PF,C');
if(!jalen||!jaylin) throw new Error('fixture: expected two J. Williams on OKC in proj.json');
const builtVersion=(code.match(/@version\s+(\S+)/)||[])[1];
const fakeNewerVersion=builtVersion+'.1'; // simulates a newer push to GitHub, to exercise the update banner
global.fetch=async(url)=>{
  if(String(url).includes('raw.githubusercontent.com')) return {ok:true,text:async()=>`// @version      ${fakeNewerVersion}`};
  return {ok:true,json:async()=>({service:{player_list:players}})};
};
eval(code);
setTimeout(()=>{
  const ws=new window.WebSocket('wss://x');
  const order=[];for(let r=0;r<13;r++){const s=[...Array(12)].map((_,i)=>i+1);order.push(...((r==1||r==2||(r>3&&r%2==0))?s.reverse():s))}
  ws.emit('message',new MessageEvent(ws,'R|'+order.join('|')));
  let pk=1, id=1; const P=[]; for(;pk<=30;pk++){ if(id===9) id++; P.push(`${pk}=${id++},${order[pk-1]},0`)}
  ws.emit('message',new MessageEvent(ws,'P|'+P.join('|')));
  ws.emit('message',new MessageEvent(ws,'D|31|'+order[30]+'|105'));
  setTimeout(async ()=>{
    if(!els[0].innerHTML.includes(`v${fakeNewerVersion} available`)) throw new Error('update banner: did not surface the newer GitHub version');
    fs.writeFileSync('test/panel.html',`<style>body{background:#222;margin:0;padding:20px}${css}</style><div id="fh" style="position:static">${els[0].innerHTML}</div>`);
    // pick id=101 (index 100): well outside the 30 picks made above, so guaranteed still available
    const target=players[100], query=target.lname.slice(0,4).toLowerCase();
    els[0]._emit('input',{target:{id:'fh-search',value:query}});
    if(!els[0].innerHTML.includes(target.lname)) throw new Error(`search: typing "${query}" did not surface ${target.lname}`);
    if(!new RegExp(`id="fh-search"[^>]*value="${query}"`).test(els[0].innerHTML)) throw new Error('search: input value not preserved across render');
    fs.writeFileSync('test/panel-search.html',`<style>body{background:#222;margin:0;padding:20px}${css}</style><div id="fh" style="position:static">${els[0].innerHTML}</div>`);
    els[0]._emit('input',{target:{id:'fh-search',value:'zzzznomatch'}});
    if(!els[0].innerHTML.includes('No available players match')) throw new Error('search: no-match state did not render');
    // index 50 is drafted way earlier than his consensus rank (reach), index 60 way later (value)
    for(const [idx,want] of [[50,'reach'],[60,'value']]){
      els[0]._emit('input',{target:{id:'fh-search',value:players[idx].lname.slice(0,4).toLowerCase()}});
      if(!new RegExp(`class="vg (up|dn)"[^>]*>[^<]*${want}<`).test(els[0].innerHTML)) throw new Error(`value gap: "${want}" badge did not render for ${players[idx].lname}`);
    }
    els[0]._emit('input',{target:{id:'fh-search',value:''}});
    if(!/xRk \d/.test(els[0].innerHTML)) throw new Error('xRank did not reach the player cards');
    // the backup Williams must show no xRank at all rather than the starter's
    els[0]._emit('input',{target:{id:'fh-search',value:'williams'}});
    const cards=els[0].innerHTML.split('<div class="s">').slice(1);
    const backup=cards.find(c=>c.includes('PF,C · OKC'));
    if(!backup) throw new Error(`collision: backup J. Williams (PF,C · OKC) missing from search results`);
    if(/xRk \d/.test(backup)) throw new Error('collision: backup J. Williams inherited the starter\'s xRank');
    const starter=cards.find(c=>c.includes('SF,PF · OKC'));
    if(!starter||!/xRk 3\d/.test(starter)) throw new Error('collision: starter J. Williams lost his own xRank');
    // on the clock at 48 (back-to-back with 49): the horizon is the next turn at 72, not your own pick at 49,
    // so a player around ADP 60 must read "Likely gone" rather than "Likely there"
    ws.emit('message',new MessageEvent(ws,'D|48|12|105'));
    await new Promise(r=>setTimeout(r,300));
    const near=players.findIndex(p=>p['average-pick']==='60');
    els[0]._emit('input',{target:{id:'fh-search',value:players[near].lname.slice(0,4).toLowerCase()}});
    const card=els[0].innerHTML.split('<div class="s">').slice(1).find(c=>c.includes(players[near].lname));
    if(!card) throw new Error('back-to-back tag: fixture player not found');
    if(/Likely there/.test(card)) throw new Error('back-to-back tag: ADP 60 read "Likely there" at pick 48 — compared against your own pick 49 instead of the next turn at 72');
    if(!/Likely gone/.test(card)) throw new Error('back-to-back tag: expected "Likely gone" for ADP 60 measured against pick 72');
    els[0]._emit('input',{target:{id:'fh-search',value:''}});
    // Best fit must never rank someone who'll still be there above someone who won't, however well he fits.
    // At pick 12 (next turn 25) the best-fitting player in the pool sits at ADP 38 — he has to yield to the
    // one who won't survive the turn, because waiting gets you both.
    ws.emit('message',new MessageEvent(ws,'D|12|12|105'));
    await new Promise(r=>setTimeout(r,300));
    const tier={'Likely gone':1,'Faller':1,'Maybe there':2,'Likely there':3};
    const rows=els[0].innerHTML.split('<div class="s">').slice(1).map(c=>({
      name:(c.match(/class="nm">([^<]+)/)||[])[1],
      tier:tier[(c.match(/class="tag \w+">([^<]+)/)||[])[1]]||1,
      net:+((c.match(/class="net [a-z]+"[^>]*><b>([+-]?\d+)/)||[])[1]||0)}));
    for(let i=1;i<rows.length;i++) if(rows[i].tier<rows[i-1].tier)
      throw new Error(`urgency sort: ${rows[i].name} (tier ${rows[i].tier}) ranked below ${rows[i-1].name} (tier ${rows[i-1].tier})`);
    if(rows[0].tier!==1) throw new Error('urgency sort: top suggestion is not from the most urgent tier');
    if(!rows.some(r=>r.tier===3)) throw new Error('urgency sort: "Likely there" players were dropped instead of sorted down');
    if(rows[0].net>=Math.max(...rows.map(r=>r.net))) throw new Error('urgency sort fixture: top row already had the best fit, so this would pass without the tier sort');
    els[0]._emit('input',{target:{id:'fh-search',value:''}});
    // pop out into its own window, then close it and make sure the inline panel comes back
    const click=(el,act)=>el._emit('click',{target:{closest:s=>s==='button'?{dataset:{act}}:null}});
    click(els[0],'pop');
    if(!popWin) throw new Error('pop out: window.open was never called');
    if(!popEls.length||!/Category ranks/.test(popEls[0].innerHTML)) throw new Error('pop out: panel did not render into the popup');
    if(els[0].style.display!=='none') throw new Error('pop out: inline overlay was left visible alongside the popup');
    const beforePop=els[0].innerHTML;
    ws.emit('message',new MessageEvent(ws,'0|31|140|'+order[30]+'|1|0'));  // a pick while popped out
    await new Promise(r=>setTimeout(r,300));
    if(els[0].innerHTML!==beforePop) throw new Error('pop out: inline overlay is still repainting while popped');
    popWin._emit('beforeunload');
    if(els[0].style.display==='none') throw new Error('popup closed: inline overlay was not restored');
    await new Promise(r=>setTimeout(r,300));
    if(!/Category ranks/.test(els[0].innerHTML)) throw new Error('popup closed: inline overlay did not resume rendering');
    console.log('ok'); process.exit(0)
  },800);
},3000);
