// Prepared for the next explicit deployment instruction. Never run on a live account.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.BASE_URL||'http://localhost:5173',out=process.argv[2];
if(!out)throw Error('Provide an evidence output directory');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),results=[],errors=[];
const snapshot=p=>p.evaluate(()=>{const s=JSON.parse(JSON.parse(localStorage.getItem('spirebound.run.v1')).payload);return {draft:s.utilityDraft,utility:s.player.utility||null,cooldown:s.utilityCooldown||0};});
async function failWrites(p,enabled){await p.evaluate(enabled=>{
 if(!window.__utilityOriginalSet)window.__utilityOriginalSet=Storage.prototype.setItem;
 Storage.prototype.setItem=enabled?function(k,v){if(this===localStorage&&k==='spirebound.run.v1')throw new DOMException('QA quota','QuotaExceededError');return window.__utilityOriginalSet.call(this,k,v);}:window.__utilityOriginalSet;
},enabled);}
try{
 for(const kind of ['auto','reduced','reload-prepared','reload-revealed','start-save-fail','claim-save-fail']){
  const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,ignoreHTTPSErrors:true}),p=await context.newPage();
  p.setDefaultTimeout(60000);p.on('pageerror',e=>errors.push(e.message));
  try{
   await p.goto(base,{waitUntil:'domcontentloaded'});await p.locator('#start').waitFor();
   await p.evaluate(async reduced=>{
    const {newRun}=await import('/src/game/engine.js'),{RunStore}=await import('/src/persistence/storage.js');
    const s=newRun(85);s.player.level=5;s.player.mainSkill='precision';s.player.precision=1;s.tutorialComplete=true;
    s.floors[1].find(r=>r.type==='boss').used=true;
    const result=new RunStore(localStorage).write(s);if(!result.ok)throw Error(result.error);
    localStorage.setItem('spirebound.settings.v1',JSON.stringify({muted:true,volume:0,reducedEffects:reduced}));
   },kind==='reduced');
   await p.reload({waitUntil:'domcontentloaded'});await p.locator('#continue').click();await p.locator('#utilityDrawStart').waitFor();
   const prepared=await snapshot(p);assert.equal(prepared.draft.status,'prepared');assert.equal(prepared.draft.offers.length,3);assert.equal(new Set(prepared.draft.offers).size,3);
   if(kind==='reload-prepared'){await p.reload({waitUntil:'domcontentloaded'});await p.locator('#continue').click();await p.locator('#utilityDrawStart').waitFor();assert.deepEqual(await snapshot(p),prepared);}
   if(kind==='start-save-fail')await failWrites(p,true);
   await p.locator('#utilityDrawStart').click();
   if(kind==='start-save-fail'){
    await p.locator('#utilitySaveRetry').waitFor();assert.deepEqual(await snapshot(p),prepared);
    await failWrites(p,false);await p.locator('#utilitySaveRetry').click();await p.locator('#utilityDrawStart').click();
   }
   if(kind==='reload-revealed'){
    // The result is durable before the animation. Reopening must not draw again.
    await p.waitForFunction(()=>JSON.parse(JSON.parse(localStorage.getItem('spirebound.run.v1')).payload).utilityDraft.status==='revealed');
    await p.reload({waitUntil:'domcontentloaded'});await p.locator('#continue').click();
   }
   await p.locator('#utilityDrawClaim').waitFor();
   const revealed=await snapshot(p);assert.equal(revealed.draft.winner,prepared.draft.winner);assert.deepEqual(revealed.draft.offers,prepared.draft.offers);assert.equal(revealed.utility,null);
   assert.equal(await p.locator('.utility-candidate.is-winner').count(),1);
   await p.screenshot({path:join(out,`utility-${kind}-revealed.png`)});
   if(kind==='claim-save-fail')await failWrites(p,true);
   await p.locator('#utilityDrawClaim').click();
   if(kind==='claim-save-fail'){
    await p.locator('#utilitySaveRetry').waitFor();assert.deepEqual(await snapshot(p),revealed);
    await failWrites(p,false);await p.locator('#utilitySaveRetry').click();
   }
   await p.waitForFunction(()=>JSON.parse(JSON.parse(localStorage.getItem('spirebound.run.v1')).payload).utilityDraft.status==='claimed');
   const claimed=await snapshot(p);assert.equal(claimed.utility,prepared.draft.winner);assert.equal(claimed.draft.status,'claimed');
   await p.reload({waitUntil:'domcontentloaded'});await p.locator('#continue').click();
   await p.waitForFunction(()=>!document.querySelector('#overlay').children.length);
   assert.equal(await p.locator('.utility-roulette').count(),0);assert.equal((await snapshot(p)).utility,claimed.utility);
   results.push({kind,winner:claimed.utility,stableResult:true,singleGrant:true});
  }catch(error){await p.screenshot({path:join(out,`failure-${kind}.png`)}).catch(()=>{});throw error;}
  finally{await context.close();}
 }
 assert.deepEqual(errors,[]);
 await writeFile(join(out,'result.json'),JSON.stringify({base,results,errors},null,2));
}finally{await browser.close();}
