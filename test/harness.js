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
const mkEl=()=>{const l={};return {style:{},classList:{toggle(){}},addEventListener(t,f){(l[t]=l[t]||[]).push(f)},_emit(t,e){(l[t]||[]).forEach(f=>f(e))},contains(){return false},querySelector(){return null},set textContent(v){css=v},set innerHTML(v){this._h=v},get innerHTML(){return this._h}}};
global.document={readyState:'complete',activeElement:null,body:{appendChild(e){els.push(e)}},head:{appendChild(){}},createElement:mkEl,querySelectorAll:()=>[],addEventListener(){}};
global.addEventListener=()=>{};
const proj=JSON.parse(fs.readFileSync('src/proj.json','utf8'));
const players=proj.slice(0,160).map((r,i)=>{const [ini,...rest]=r[0].split(' ');return {id:i+1,fname:ini.replace('.','')+'x',lname:rest.join(' '),team_abbr:r[1],display_pos:r[2],inj:i%17==0?'GTD':'','average-pick':String(i==50?20:i==60?120:i+1),'percent-drafted':i==40?'0.02':'1.0',o_rank:i+1,season_stats:{},projected_stats:(i%2?{}:(()=>{const p=r[3]||[],g=p[0]||70;const fga=15*g,fta=5*g;return {0:g,3:fga,4:fga*(p[1]||.47),5:p[1],6:fta,7:fta*(p[2]||.78),8:p[2],10:p[3]*g,12:p[4]*g,15:p[5]*g,16:p[6]*g,17:p[7]*g,18:p[8]*g,19:p[9]*g}})())}});
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
  setTimeout(()=>{
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
    console.log('ok'); process.exit(0)
  },800);
},3000);
