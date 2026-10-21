import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href),base=process.env.BASE_URL||'http://localhost:5173',out=process.argv[2];await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],results=[];let active,scores=0;
async function record(p){return p.evaluate(()=>({history:JSON.parse(localStorage.getItem('spirebound.history')||'[]').map(r=>({id:r.id,time:r.time,won:r.won,ranking:r.ranking})),ended:localStorage.getItem('spirebound.run.v1.ended'),saved:!!localStorage.getItem('spirebound.run.v1')}));}
async function open(kind,width=844){
 const c=await browser.newContext({viewport:{width,height:width===1280?720:390},isMobile:width<1000,hasTouch:width<1000,ignoreHTTPSErrors:true}),p=await c.newPage();active=p;p.setDefaultTimeout(90000);p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(r.method()==='POST'&&r.url().endsWith('/api/records'))scores++;});
 await c.addInitScript(()=>{window.__recordWrites={history:0,ended:0,draft:0};const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(this===localStorage){if(k==='spirebound.history')window.__recordWrites.history++;if(k==='spirebound.run.v1.ended')window.__recordWrites.ended++;if(k==='spirebound.rank-submissions.v1')window.__recordWrites.draft++;}return set.call(this,k,v);};});
 if(kind==='reduced')await c.addInitScript(()=>localStorage.setItem('spirebound.settings.v1',JSON.stringify({muted:true,volume:0,reducedEffects:true})));
 let release;const gate=new Promise(r=>release=r);
 if(['held','fail','queued-skip','queued-blur'].includes(kind))await p.route('**/escape-dawn-v1.png',async r=>{if(kind==='fail')await r.abort();else{await gate;await r.continue().catch(()=>{});}});
 await p.goto(base,{waitUntil:'domcontentloaded'});await p.locator('#continue,#start').first().waitFor();
 const initial=await p.evaluate(()=>performance.getEntriesByType('resource').filter(e=>e.name.endsWith('.png')).map(e=>new URL(e.name).pathname.split('/').at(-1)));
 assert.equal(initial.includes('escape-dawn-v1.png'),false);assert.equal(initial.includes('entrance-doors-v1.png'),false);
 await p.evaluate(async(kind)=>{
  const {newRun,enrage,currentRoom}=await import('/src/game/engine.js'),{RunStore}=await import('/src/persistence/storage.js'),{startFinalEscape,tickFinalEscape}=await import('/src/world/final-escape.js'),{objectPoint}=await import('/src/world/object-positions.js'),{challengeDemon,advanceDemonPhase}=await import('/src/combat/demon.js');
  const s=newRun(77,{campaign:'expanded'});s.floor=9;s.room=1;challengeDemon(s);const boss=currentRoom(s);while(boss.demon.phase<3){boss.enemies.forEach(e=>e.hp=0);advanceDemonPhase(boss,s.projectiles);}boss.enemies=[];boss.used=true;enrage(s);s.returnNoticePending=false;s.floor=0;s.room=s.floors[0].findIndex(r=>r.type==='exit');s.floors[9][1].used=true;s.floors[9][1].demonPending=false;
  Object.assign(s.player,{mainSkill:'precision',precision:1,hp:10,max:10});s.invulnerable=999;s.attack=999;s.tutorialComplete=true;
  const r=currentRoom(s);r.enemies=[];r.seen=true;startFinalEscape(s,r);tickFinalEscape(s,r,36);Object.assign(s.player,objectPoint(r));
  if(kind==='draft')s.ranking.online={runId:s.runId,startedAt:Date.now()};const result=new RunStore(localStorage).write(s);if(!result.ok)throw Error(result.error);
 },kind);
 await p.reload({waitUntil:'domcontentloaded'});await p.locator('#continue').click();await p.waitForFunction(()=>!document.querySelector('#overlay').children.length);
 if(!['held','fail','queued-skip','queued-blur'].includes(kind))await p.evaluate(async()=>{await (await import('/src/ui/escape-scene.js')).prepareEscapeArt();});
 if(kind==='save-fail')await p.evaluate(()=>{const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='spirebound.history')throw new DOMException('QA quota','QuotaExceededError');return set.call(this,k,v);};});
 await p.locator('#interact').click();return {c,p,release,initial};
}
try{
 const core=process.argv.includes('--public-core');
 const cases=core?[['auto',844],['space',844],['held',844]]:[['draft',844],['auto',1280],['auto',844],['space',844],['click',844],['blur',844],['portrait',844],['resize',1280],['pagehide',844],['hidden',844],['gap',844],['reduced',844],['held',844],['fail',844],['queued-skip',844],['queued-blur',844],['save-fail',844]];
 const only=process.argv.find(a=>a.startsWith('--only='))?.slice(7).split(',');
 for(const [kind,width] of cases.filter(([kind])=>!only||only.includes(kind))){console.log(kind,width);const {c,p,release,initial}=await open(kind,width),started=Date.now();
  if(kind==='save-fail'){await p.locator('.result-save').waitFor();assert.match(await p.locator('.result-save').innerText(),/기록을 내려받으세요/);assert.equal(await p.locator('#export').isVisible(),true);assert.equal(await p.locator('.escape-scene').count(),0);assert.equal((await record(p)).history.length,0);}
  else{
   if(['held','queued-skip','queued-blur'].includes(kind)){
    await p.locator('.escape-loading').waitFor();assert.equal((await record(p)).history.length,1);
    if(kind==='queued-skip')await p.locator('#escapeSkip').click();else if(kind==='queued-blur')await p.evaluate(()=>window.dispatchEvent(new Event('blur')));
    await p.locator('.result-win').waitFor();assert.ok(Date.now()-started<2500);release();await p.waitForTimeout(150);assert.equal(await p.locator('.escape-scene').count(),0);
   }else if(kind==='fail'){await p.locator('.result-win').waitFor();assert.equal(await p.locator('.escape-scene').count(),0);}
   else{
    await p.locator('.escape-scene').waitFor();const before=await record(p);assert.equal(before.history.length,1);assert.equal(before.saved,false);
    assert.ok((await p.locator('#escapeSkip').boundingBox()).height>=44);
    if(kind==='auto'||kind==='reduced'){
     for(const [phase,at] of [[0,.24],[1,1.2],[2,2.5]]){await p.waitForFunction(({phase,at})=>{const e=document.querySelector('.escape-scene');return e&&+e.dataset.escapePhase===phase&&+e.dataset.escapeTime>=at;},{phase,at});await p.screenshot({path:join(out,`escape-${kind}-${width}-${phase}.png`)});}
    }else if(kind==='space'){await p.waitForTimeout(190);await p.keyboard.press('Space');}
    else if(kind==='draft'){await p.locator('#escapeSkip').click();}
    else if(kind==='click')await p.locator('#escapeSkip').click();
    else if(kind==='portrait')await p.setViewportSize({width:390,height:844});
    else if(kind==='resize')await p.setViewportSize({width:1100,height:700});
    else if(kind==='hidden')await p.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
    else if(kind==='gap')await p.evaluate(()=>{const until=performance.now()+1100;while(performance.now()<until){}});
    else await p.evaluate(kind=>window.dispatchEvent(new Event(kind)),kind);
    await p.locator('.result-win').waitFor();assert.deepEqual(await record(p),before);assert.equal(await p.locator('#again').isVisible(),true);assert.deepEqual(await p.evaluate(()=>window.__recordWrites),{history:1,ended:1,draft:kind==='draft'?1:0});if(kind==='draft'){assert.equal(await p.locator('#rankRegister').isVisible(),true);assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('spirebound.rank-submissions.v1')).length),1);}
    if(kind==='auto'){await p.locator('#journal').click();await p.locator('#closeJournal').click();assert.equal(await p.locator('.escape-scene').count(),0);await p.reload({waitUntil:'domcontentloaded'});await p.locator('#start').waitFor();assert.equal(await p.locator('#continue').count(),0);assert.equal(await p.locator('.escape-scene').count(),0);assert.deepEqual(await record(p),before);}
   }
   assert.equal((await record(p)).history.length,1);
  }
  results.push({kind,width,recordOnce:true,titleEndingAssets:false,initialPng:initial});await c.close();
 }
 assert.deepEqual(errors,[]);assert.equal(scores,0);await writeFile(join(out,'result.json'),JSON.stringify({base,results,errors,scoreSubmissions:scores},null,2));console.log(JSON.stringify({cases:results.length,errors,scores}));
}catch(e){if(active&&!active.isClosed()){await active.screenshot({path:join(out,'failure.png')}).catch(()=>{});await writeFile(join(out,'failure.json'),JSON.stringify({error:String(e),results,overlay:await active.locator('#overlay').innerText().catch(()=>''),record:await record(active).catch(()=>null),errors,scores},null,2));}throw e;}finally{await browser.close();}
