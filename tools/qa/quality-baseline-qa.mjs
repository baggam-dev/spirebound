import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const output=process.argv[2]||'artifacts/quality-baseline';
const base=process.env.SPIREBOUND_URL||'http://localhost:5173';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
try{
 for(const [width,height,mobile] of [[1280,800,false],[844,390,true]])for(const boss of [false,true]){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base);
  await page.evaluate(async boss=>{
   const {newRun}=await import('/src/game/engine.js');
   const {encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js');
   const run=newRun(419);run.tutorialComplete=true;
   run.floor=boss?1:0;
   run.room=run.floors[run.floor].findIndex(room=>room.type===(boss?'boss':'normal')&&room.enemies.length);
   if(run.room<0)throw Error('Scene fixture missing');
   run.player.x=480;run.player.y=310;
   localStorage.setItem(SAVE_KEY,encodeSave(run));
  },boss);
  await page.reload();await page.locator('#continue').click();
  await page.waitForFunction(floor=>document.querySelector('#floor')?.textContent?.startsWith(`${floor}층`),boss?2:1);
  await page.waitForTimeout(250);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:join(output,`${boss?'boss2':'room1'}-${mobile?'mobile':'pc'}.png`)});
  await context.close();
 }
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({scenes:2,viewports:2,pageErrors:0}));
}finally{await browser.close();}
