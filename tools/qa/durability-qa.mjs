import {pathToFileURL} from 'node:url';
import {join} from 'node:path';
import assert from 'node:assert/strict';

const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.SPIREBOUND_URL||'http://localhost:5173';
const duration=Number(process.env.SPIREBOUND_DURATION_MS||31*60_000);
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1280,height:800}});
const page=await context.newPage(),errors=[];
page.on('pageerror',error=>errors.push(error.message));
const saved=()=>page.evaluate(async()=>{
 const {RunStore}=await import('/src/persistence/storage.js');
 const {run,error}=new RunStore(localStorage).read();
 if(!run)throw Error(error||'Missing save');
 return {id:run.runId,elapsed:run.elapsed,floor:run.floor,room:run.room,status:run.status};
});
const playing=async()=>assert.equal(await page.locator('#overlay').evaluate(node=>node.innerHTML),'');
const resume=async()=>{await page.locator('#resume').click();await playing();};
const pause=async()=>{await page.locator('#pause').click();await page.locator('#resume').waitFor();};
try{
 await page.goto(base);
 await page.evaluate(async()=>{
  const {newRun}=await import('/src/game/engine.js');
  const {encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js');
  const run=newRun(913);run.tutorialComplete=true;run.player.mainSkill='fire';run.player.fire=1;
  run.player.x=480;run.player.y=270;run.floors[0][0].enemies=[];run.floors[0][0].obstacles=[];
  localStorage.setItem(SAVE_KEY,encodeSave(run));
 });
 await page.reload();await page.locator('#continue').click();await playing();
 const initial=await saved(),started=Date.now();let nextLog=started+60_000,stage=0;
 while(Date.now()-started<duration){
  await page.waitForTimeout(Math.min(10_000,Math.max(100,started+duration-Date.now())));
  const elapsed=Date.now()-started;
  if(stage===0&&elapsed>=duration*.15){
   await pause();const before=await saved();await page.waitForTimeout(1200);assert.equal((await saved()).elapsed,before.elapsed);
   await resume();stage++;console.log(JSON.stringify({stage:'manual-pause',wallMs:elapsed,savedSeconds:before.elapsed}));
  }
  if(stage===1&&elapsed>=duration*.30){
   const other=await context.newPage();await other.goto(base);await other.bringToFront();
   // Headless Edge may keep the first page visible; exercise the real blur handler explicitly.
   await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
   await page.locator('#resume').waitFor({timeout:10_000});const before=await saved();
   await page.waitForTimeout(1200);assert.equal((await saved()).elapsed,before.elapsed);
   await other.close();await page.bringToFront();await resume();stage++;
   console.log(JSON.stringify({stage:'background',wallMs:elapsed,savedSeconds:before.elapsed}));
  }
  if(stage===2&&elapsed>=duration*.45){
   await pause();const before=await saved();await page.reload();await page.locator('#continue').click();
   await playing();const after=await saved();assert.equal(after.id,before.id);assert.ok(after.elapsed>=before.elapsed);
   stage++;console.log(JSON.stringify({stage:'reload-resume',wallMs:elapsed,savedSeconds:after.elapsed}));
  }
  if(stage===3&&elapsed>=duration*.60){
   await page.setViewportSize({width:390,height:844});await page.locator('#resume').waitFor({timeout:10_000});
   const before=await saved();await page.waitForTimeout(1200);assert.equal((await saved()).elapsed,before.elapsed);
   await resume();await page.setViewportSize({width:844,height:390});await page.locator('#resume').waitFor({timeout:10_000});
   await resume();stage++;console.log(JSON.stringify({stage:'rotation',wallMs:elapsed,savedSeconds:before.elapsed}));
  }
  if(stage===4&&elapsed>=duration*.75){
   await page.keyboard.down('ArrowRight');await page.waitForTimeout(300);await page.keyboard.up('ArrowRight');
   await page.keyboard.down('ArrowLeft');await page.waitForTimeout(300);await page.keyboard.up('ArrowLeft');
   await pause();const before=await saved();await page.locator('#quit').click();
   await page.locator('#continue').click();await playing();assert.equal((await saved()).id,before.id);
   stage++;console.log(JSON.stringify({stage:'title-resume',wallMs:elapsed,savedSeconds:before.elapsed}));
  }
  if(Date.now()>=nextLog){
   const current=await saved();assert.equal(current.id,initial.id);assert.equal(current.status,'playing');
   assert.equal(await page.locator('#saveStatus').textContent(),'진행 저장됨');
   console.log(JSON.stringify({stage:'heartbeat',wallMs:Date.now()-started,savedSeconds:current.elapsed}));
   nextLog+=60_000;
  }
 }
 await pause();const final=await saved();const wallMs=Date.now()-started;
 assert.ok(wallMs>=duration);assert.ok(final.elapsed>initial.elapsed+duration/1000*.75);
 assert.equal(stage,5);assert.deepEqual(errors,[]);
 const mobileContext=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
 const mobile=await mobileContext.newPage();mobile.on('pageerror',error=>errors.push(error.message));
 await mobile.goto(base);
 await mobile.evaluate(async()=>{
  const {newRun}=await import('/src/game/engine.js');
  const {encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js');
  const run=newRun(914);run.tutorialComplete=true;run.player.mainSkill='fire';run.player.fire=1;
  run.floors[0][0].enemies=[];localStorage.setItem(SAVE_KEY,encodeSave(run));
 });
 await mobile.reload();await mobile.locator('#continue').click();
 await mobile.setViewportSize({width:390,height:844});await mobile.locator('#resume').waitFor();
 const mobileId=await mobile.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('spirebound.run.v1')).payload).runId);
 await mobile.locator('#resume').tap();await mobile.setViewportSize({width:844,height:390});
 await mobile.locator('#resume').waitFor();await mobile.reload();await mobile.locator('#continue').tap();
 assert.equal(await mobile.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('spirebound.run.v1')).payload).runId),mobileId);
 assert.deepEqual(errors,[]);await mobileContext.close();
 console.log(JSON.stringify({result:'passed',wallMs,activeSeconds:final.elapsed-initial.elapsed,pageErrors:errors.length,stages:stage,mobileOrientation:true}));
}finally{await browser.close();}
