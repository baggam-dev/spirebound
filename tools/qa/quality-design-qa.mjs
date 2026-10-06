import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.SPIREBOUND_URL||'http://localhost:5173';
const output=process.argv[2];if(output)await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
try{
 for(const [width,height,mobile,label,capture] of [[1280,800,false,'pc',true],[844,390,true,'mobile',true],[667,375,true,'mobile-small',false],[390,844,true,'mobile-portrait',false]])for(const boss of [false,true]){
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
  const geometry=await page.evaluate(()=>{
   const arena=document.querySelector('.arena').getBoundingClientRect(),stats=document.querySelector('#statReadout').getBoundingClientRect();
   return {scroll:document.documentElement.scrollWidth<=innerWidth,font:parseFloat(getComputedStyle(document.querySelector('#statReadout')).fontSize),xpFont:parseFloat(getComputedStyle(document.querySelector('#xpLabel')).fontSize),statsInside:stats.right<=arena.right+1&&stats.bottom<=arena.bottom+1};
  });
  assert.equal(geometry.scroll,true);assert.equal(geometry.statsInside,true);
  if(mobile&&width>height){assert.ok(geometry.font>=10);assert.ok(geometry.xpFont>=10);}
  if(output&&capture)await page.screenshot({path:join(output,`${boss?'boss2':'room1'}-${label}.png`)});
  await context.close();
 }
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({scenes:2,viewports:4,mobileReadableStats:true,pageErrors:0}));
}finally{await browser.close();}
