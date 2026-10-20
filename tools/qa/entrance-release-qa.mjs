import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href),base=process.env.BASE_URL||'http://localhost:5173',out=process.argv[2];await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],results=[];let activePage,scores=0;
const files=['title-background-v1.png','title-logo-v1.png','title-hero-idle-v1.png','title-branch-v1.png'];
async function game(p){await p.waitForFunction(()=>!document.querySelector('#overlay').children.length);}
async function scene(p){await p.locator('.entrance-scene').waitFor();}
async function phase(p,n){await p.waitForFunction(n=>document.querySelector('.entrance-scene')&&document.querySelector('#overlay').dataset.entrancePhase===String(n),n);}
async function snapshot(p){return p.evaluate(async()=>{const {RunStore}=await import('/src/persistence/storage.js'),s=new RunStore(localStorage).read().run;return s?{elapsed:s.elapsed,dodge:s.dodge,skill:s.skill,hp:s.player.hp,potions:s.player.potions,x:s.player.x,y:s.player.y,online:!!s.ranking.online,storedEntrance:Object.keys(s).some(k=>/entrance/i.test(k))}:null;});}
async function open(kind,width=844,height=390){
 const c=await browser.newContext({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000}),p=await c.newPage();activePage=p;p.setDefaultTimeout(120000);p.on('pageerror',e=>errors.push(e.message));const requests=[];p.on('request',r=>{if(r.method()==='POST'&&r.url().endsWith('/api/records'))scores++;if(/\/assets\/images\/.*\.png$/.test(r.url()))requests.push(new URL(r.url()).pathname.split('/').at(-1));});
 // Isolated failure exercises the real local-start UI without fake online records.
 await p.route('**/api/session',r=>r.fulfill({status:503,contentType:'application/json',body:'{"error":"network"}'}));
 if(kind==='lease')await c.addInitScript(()=>Object.defineProperty(navigator,'locks',{value:undefined,configurable:true}));
 if(kind==='save-fail')await c.addInitScript(()=>{const set=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key.startsWith('spirebound.run.v1'))throw new DOMException('QA quota','QuotaExceededError');return set.call(this,key,value);};});
 if(kind==='reduced')await c.addInitScript(()=>localStorage.setItem('spirebound.settings.v1',JSON.stringify({muted:true,volume:0,reducedEffects:true})));
 let release;const gate=new Promise(r=>release=r);
 if(kind==='held'||kind==='asset-fail')await p.route('**/assets/images/entrance-*.png',async r=>{if(kind==='held'){await gate;await r.continue().catch(()=>{});}else await r.abort();});
 await p.goto(base,{waitUntil:'domcontentloaded'});await p.locator('#start').waitFor();await p.evaluate(async files=>{await Promise.all(files.map(async f=>{const i=new Image();i.src='/assets/images/'+f;await i.decode();}));},files);assert.deepEqual([...new Set(requests)].sort(),[...files].sort());
 await p.evaluate(()=>{window.__entranceCount=0;const seen=new WeakSet();new MutationObserver(()=>{const el=document.querySelector('.entrance-scene');if(el&&!seen.has(el)){seen.add(el);window.__entranceCount++;}}).observe(document.getElementById('overlay'),{subtree:true,childList:true});});
 return {c,p,requests,release};
}
async function startLocal(p,retry=false){await p.locator('#start').click();await p.locator('#rankStartLocal').waitFor();assert.equal(await p.locator('.entrance-scene').count(),0);if(retry){await p.locator('#rankStartRetry').click();await p.locator('#rankStartLocal').waitFor();await p.locator('#rankStartCancel').click();await p.locator('#start').click();await p.locator('#rankStartLocal').waitFor();}await p.locator('#rankStartLocal').click();}
try{
 for(const [kind,width,height] of [['auto',1280,720],['auto',844,390],['space',844,390],['held',844,390],['asset-fail',844,390],['blur',844,390],['portrait',844,390],['lease',844,390],['save-fail',844,390],['reduced',844,390],['practice',844,390]]){
  const {c,p,requests,release}=await open(kind,width,height);console.log('case '+kind+' '+width);
  if(kind==='practice'){await p.locator('#bossPractice').click();await p.locator('#practiceBoss').selectOption('warden');await p.locator('#rollPractice').click();await p.locator('#launchPractice').click();await game(p);assert.equal(await p.evaluate(()=>window.__entranceCount),0);assert.equal(requests.some(f=>f.startsWith('entrance-')),false);results.push({kind,width,noReplay:true});await c.close();continue;}
  await startLocal(p,kind==='auto'&&width===1280);
  if(kind==='save-fail'){await p.locator('#resume').waitFor();assert.match(await p.locator('#overlay').innerText(),/저장/);assert.equal(await p.evaluate(()=>window.__entranceCount),0);assert.equal(requests.some(f=>f.startsWith('entrance-')),false);await p.screenshot({path:join(out,'save-fail.png')});results.push({kind,width,noReplay:true});await c.close();continue;}
  if(kind==='held'){await p.locator('.entrance-loading').waitFor();const s=await snapshot(p);assert.equal(s.elapsed,0);await p.locator('#entranceSkip').click();await game(p);release();await p.waitForLoadState('networkidle');assert.equal(await p.evaluate(()=>window.__entranceCount),0);results.push({kind,width,skipQueued:true,lateArtIgnored:true});await c.close();continue;}
  if(kind==='asset-fail'){await game(p);assert.equal(await p.evaluate(()=>window.__entranceCount),0);results.push({kind,width,failureFallback:true});await c.close();continue;}
  await scene(p);const entered=Date.now(),before=await snapshot(p);assert.equal(before.elapsed,0);assert.equal(before.storedEntrance,false);assert.equal(before.online,false);
  if(kind==='auto'){
   for(let n=0;n<3;n++){await phase(p,n);await p.waitForTimeout(n===2?600:n===1?250:150);await p.screenshot({path:join(out,`scene-${width}-${n}.png`)});}
   await game(p);const duration=Date.now()-entered;assert.ok(duration>=2900&&duration<8000,'automatic entrance duration');await p.locator('#pause').click();await p.locator('#resume').waitFor();await p.reload({waitUntil:'domcontentloaded'});await p.locator('#continue').waitFor();await p.evaluate(()=>{window.__entranceCount=0;new MutationObserver(()=>{if(document.querySelector('.entrance-scene'))window.__entranceCount++;}).observe(document.getElementById('overlay'),{subtree:true,childList:true});});const prior=requests.length;await p.locator('#continue').click();await game(p);assert.equal(await p.evaluate(()=>window.__entranceCount),0);assert.equal(requests.slice(prior).some(f=>f.startsWith('entrance-')),false);results.push({kind,width,duration,noReplayOnReload:true});
  }else if(kind==='space'){
   await p.waitForTimeout(220);await p.keyboard.press('q');await p.keyboard.press('Space');await game(p);await p.locator('#pause').click();await p.locator('#resume').waitFor();const after=await snapshot(p);assert.equal(after.dodge,0);assert.equal(after.potions,before.potions);assert.equal(after.x,before.x);assert.equal(after.y,before.y);assert.ok(after.elapsed<1);await p.locator('#resume').click();await game(p);assert.equal(await p.evaluate(()=>window.__entranceCount),1);results.push({kind,width,inputConsumed:true});
  }else if(kind==='blur'){
   await phase(p,1);await p.evaluate(()=>window.dispatchEvent(new Event('blur')));await p.locator('#resume').waitFor();const paused=await snapshot(p);assert.equal(paused.elapsed,0);await p.waitForTimeout(3800);assert.equal(await p.locator('#resume').isVisible(),true);await p.locator('#resume').click();await game(p);assert.equal(await p.evaluate(()=>window.__entranceCount),1);results.push({kind,width,clockFrozen:true,noHiddenAutoResume:true});
  }else if(kind==='portrait'){
   await phase(p,1);await p.setViewportSize({width:390,height:844});await p.locator('#resume').waitFor();assert.equal((await snapshot(p)).elapsed,0);await p.setViewportSize({width:844,height:390});await p.locator('#resume').click();await game(p);assert.equal(await p.evaluate(()=>window.__entranceCount),1);results.push({kind,width,rotationPause:true});
  }else if(kind==='lease'){
   await p.evaluate(()=>localStorage.setItem('spirebound.active-tab',JSON.stringify({owner:'qa-other',until:Date.now()+15000})));await p.getByRole('heading',{name:'다른 탭에서 진행 중'}).waitFor();await p.waitForTimeout(3800);assert.equal(await p.locator('.entrance-scene').count(),0);assert.equal(await p.locator('#goTitle').isVisible(),true);results.push({kind,width,leaseLossStops:true});
  }else if(kind==='reduced'){
   await phase(p,2);await p.screenshot({path:join(out,'reduced.png')});await p.keyboard.press('Escape');await game(p);results.push({kind,width,reducedMutedSkip:true});
  }
  await p.screenshot({path:join(out,`after-${kind}-${width}.png`)});await c.close();
 }
 assert.deepEqual(errors,[]);assert.equal(scores,0);await writeFile(join(out,'result.json'),JSON.stringify({base,results,errors,scoreSubmissions:scores},null,2));console.log(JSON.stringify({cases:results.length,errors,scoreSubmissions:scores}));
}catch(e){if(activePage&&!activePage.isClosed()){await activePage.screenshot({path:join(out,'failure.png')});await writeFile(join(out,'failure.json'),JSON.stringify({error:e.message,url:activePage.url(),overlay:await activePage.evaluate(()=>document.getElementById('overlay')?.innerText||''),errors,results},null,2));}throw e;}finally{await browser.close();}
