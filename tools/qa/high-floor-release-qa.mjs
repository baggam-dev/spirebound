// Isolated saved fixtures run through the production RAF/UI. No score submissions.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.BASE_URL||'http://localhost:5173',out=process.argv[2];await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),results=[],errors=[];let scores=0;
const kinds=['starKnight','royalGuard','astralSniper','gravityMage','starBearer','pulseTurret','riftHunter','demonSoldier','demonCaptain'];
async function saved(p){return p.evaluate(async()=>{const {RunStore}=await import('/src/persistence/storage.js'),s=new RunStore(localStorage).read().run;if(!s)throw Error('Save missing');const r=s.floors[s.floor][s.room];return {elapsed:s.elapsed,hp:s.player.hp,enemies:r.enemies,player:s.player};});}
async function pause(p){await p.keyboard.press('Escape');await p.locator('#resume').waitFor();assert.doesNotMatch(await p.locator('#saveStatus').innerText(),/실패/);return saved(p);}
try{
 for(const kind of (process.argv.includes('--public-core')?['royalGuard','astralSniper','crowd-reduced']:[...kinds,'crowd','crowd-reduced'])){
  console.log(kind);const width=kind==='starKnight'?1280:844;
  const cx=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width,height:width===1280?800:390},isMobile:width<1000,hasTouch:width<1000}),p=await cx.newPage();p.setDefaultTimeout(180000);
  p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(r.method()==='POST'&&r.url().endsWith('/api/records'))scores++;});
  if(kind==='crowd-reduced')await cx.addInitScript(()=>localStorage.setItem('spirebound.settings.v1',JSON.stringify({muted:true,volume:0,reducedEffects:true})));
  await p.goto(base,{waitUntil:'domcontentloaded'});
  await p.evaluate(async kind=>{
   const {newRun,currentRoom}=await import('/src/game/engine.js'),{RunStore}=await import('/src/persistence/storage.js');
   const s=newRun(871,{campaign:'expanded'});s.floor=kind.startsWith('demon')?8:6;s.room=s.floors[s.floor].findIndex(r=>r.type==='normal');s.tutorialComplete=true;s.attack=999;s.entryGrace=0;s.invulnerable=999;Object.assign(s.player,{x:480,y:300,hp:10,max:10});const r=currentRoom(s);r.tutorial=false;r.seen=true;r.obstacles=[];
   const enemy=(type,id,x,y)=>({type,id,x,y,hp:10000,max:10000,cd:0,balanceVersion:1});
   r.enemies=kind.startsWith('crowd')?Array.from({length:24},(_,i)=>enemy(['chaser','starKnight','royalGuard','astralSniper'][i%4],i,130+(i%8)*92,120+Math.floor(i/8)*74)):[enemy(kind,0,['astralSniper','pulseTurret','demonCaptain'].includes(kind)?220:430,300)];
   if(kind.startsWith('crowd'))r.obstacles=[{x:320,y:210,w:55,h:55,type:'rock'},{x:590,y:210,w:55,h:55,type:'bones'}];
   const written=new RunStore(localStorage).write(s);if(!written.ok)throw Error(written.error);
  },kind);
  await p.reload({waitUntil:'domcontentloaded'});await p.locator('#continue').click();await p.waitForFunction(()=>!document.querySelector('#overlay').children.length);await p.waitForTimeout(200);
  const first=await pause(p);assert.equal(first.enemies.length,kind.startsWith('crowd')?24:1);
  if(!kind.startsWith('crowd'))assert.ok(first.enemies[0].highAttack,'new controller must own the live attack: '+kind);
  await p.locator('#overlay').evaluate(e=>e.style.visibility='hidden');await p.screenshot({path:join(out,kind+'.png')});await p.locator('#overlay').evaluate(e=>e.style.visibility='');
  await p.reload({waitUntil:'domcontentloaded'});await p.locator('#continue').click();await p.waitForFunction(()=>!document.querySelector('#overlay').children.length);
  const timing=await p.evaluate(()=>new Promise(resolve=>{let last=performance.now();const a=[];function tick(now){a.push(now-last);last=now;if(a.length<120)requestAnimationFrame(tick);else{a.sort((x,y)=>x-y);resolve({samples:a.length,mean:a.reduce((x,y)=>x+y,0)/a.length,p95:a[113]});}}requestAnimationFrame(tick);}));
  const resumed=await pause(p);assert.ok(resumed.elapsed>first.elapsed);assert.equal(resumed.hp,10);assert.equal(resumed.enemies.length,first.enemies.length);assert.deepEqual([resumed.player.x,resumed.player.y],[480,300]);
  const warnings=resumed.enemies.filter(e=>e.highAttack&&e.highAttack.stage!=='recover'||e.chaserWindup>0).length;assert.ok(warnings<=2,'shared warning budget');
  results.push({kind,width,saveResume:true,elapsed:resumed.elapsed,warnings,frameTiming:timing});await cx.close();
 }
 assert.deepEqual(errors,[]);assert.equal(scores,0);await writeFile(join(out,'result.json'),JSON.stringify({base,results,errors,scoreSubmissions:scores},null,2));console.log(JSON.stringify({cases:results.length,errors,scores}));
}finally{await browser.close();}
