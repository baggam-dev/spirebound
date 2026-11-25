import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs')).href);
const base=process.env.BASE_URL||'http://localhost:5173',out=process.argv[2]||'docs/qa-predeploy-20261125/opening';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],results=[];let active;
const game=p=>p.waitForFunction(()=>!document.querySelector('#overlay').children.length);
const snapshot=p=>p.evaluate(async()=>{const {RunStore}=await import('/src/persistence/storage.js');const s=new RunStore(localStorage).read().run;return s?{id:s.runId,elapsed:s.elapsed,hp:s.player.hp,dodge:s.dodge}:null;});
try{
 for(const [kind,width] of (process.argv.includes('--auto')?[['auto',1280]]:[['normal',1280],['normal',844],['reduced',844],['failure',844]])){
  const context=await browser.newContext({viewport:{width,height:width===1280?720:390},isMobile:width<1000,hasTouch:width<1000,reducedMotion:kind==='reduced'?'reduce':'no-preference'}),p=await context.newPage();active=p;p.setDefaultTimeout(60000);p.on('pageerror',e=>errors.push(String(e)));
  await p.route('**/api/session',r=>r.fulfill({status:503,contentType:'application/json',body:'{"error":"offline"}'}));
  if(kind==='failure'){await p.route('**/opening-story-v1.png',r=>r.abort());await p.route('**/entrance-night-*.png',r=>r.abort());}
  await p.goto(base);await p.locator('#start').waitFor();
  await p.locator('#storyReplay').click();await p.locator('.opening-story').waitFor();assert.equal(await snapshot(p),null);await p.locator('#storyPause').click();const still=await p.locator('.entrance-canvas').evaluate(c=>c.toDataURL());await p.waitForTimeout(250);assert.equal(await p.locator('.entrance-canvas').evaluate(c=>c.toDataURL()),still);await p.locator('#entranceSkip').click();await p.locator('#start').waitFor();assert.equal(await snapshot(p),null);
  // Replay was seen; explicitly restore first-run preference for the actual launch case.
  await p.evaluate(()=>localStorage.removeItem('spirebound.opening.v1'));
  await p.locator('#start').click();await p.locator('#rankStartLocal').click();await p.locator('.opening-story').waitFor();const before=await snapshot(p);assert.equal(before.elapsed,0);
  if(kind==='auto'){const begun=Date.now();await p.waitForFunction(()=>document.querySelector('#overlay').dataset.storyFrame==='3',null,{timeout:35000});await p.screenshot({path:join(out,'auto-story-last.png')});await p.locator('.entrance-scene:not(.opening-story)').waitFor();await p.waitForFunction(()=>document.querySelector('#overlay').dataset.entrancePhase==='2');await p.screenshot({path:join(out,'auto-entry-interior.png')});await game(p);const duration=Date.now()-begun;assert.ok(duration>=33000&&duration<45000);results.push({kind,width,duration,autoComplete:true});await context.close();continue;}
  await p.locator('#storyPause').click();await p.waitForTimeout(200);assert.deepEqual(await snapshot(p),before);await p.screenshot({path:join(out,`${kind}-${width}-story.png`)});
  if(kind==='normal'){
   await p.evaluate(()=>window.dispatchEvent(new Event('blur')));await p.locator('#resume').waitFor();assert.deepEqual(await snapshot(p),before);await p.locator('#resume').click();await p.locator('.opening-story').waitFor();
  }
  await p.locator('#entranceSkip').click();
  if(kind==='failure')await game(p);else{await p.locator('.entrance-scene:not(.opening-story)').waitFor();assert.deepEqual(await snapshot(p),before);await p.waitForTimeout(300);await p.screenshot({path:join(out,`${kind}-${width}-entrance.png`)});await p.locator('#entranceSkip').click();await game(p);}
  await p.locator('#pause').click();await p.locator('#resume').waitFor();const after=await snapshot(p);assert.equal(after.id,before.id);assert.ok(after.elapsed<1);await p.reload();await p.locator('#continue').click();await game(p);assert.equal(await p.locator('.entrance-scene').count(),0);
  results.push({kind,width,replayWithoutRun:true,frozen:true,sameRun:true,continueNoIntro:true});await context.close();
 }
 assert.deepEqual(errors,[]);await writeFile(join(out,'results.json'),JSON.stringify({base,results,errors},null,2));console.log(JSON.stringify({results,errors}));
}catch(e){if(active&&!active.isClosed()){await active.screenshot({path:join(out,'failure.png')});await writeFile(join(out,'failure.json'),JSON.stringify({message:e.message,overlay:await active.locator('#overlay').innerText(),errors,results},null,2));}throw e;}finally{await browser.close();}
