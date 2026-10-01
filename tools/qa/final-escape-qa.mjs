import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';

const {chromium}=await import(process.env.PLAYWRIGHT_PATH?pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href:'playwright');
const base=process.env.SPIREBOUND_URL||'http://localhost:5173',output=process.argv[2]||'artifacts/final-escape';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],results=[];
try{
 for(const [width,height,mobile,campaign] of [[1280,800,false,'classic'],[1280,800,false,'expanded'],[844,390,true,'classic'],[390,844,true,'classic']]){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile}),page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base);
  await page.evaluate(async campaign=>{
   const {newRun}=await import('/src/game/engine.js'),{encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js');
   const {objectPoint}=await import('/src/world/object-positions.js');
   const s=newRun(88,{campaign});s.tutorialComplete=true;s.player.mainSkill='fire';s.player.fire=1;s.invulnerable=999;
   if(campaign==='expanded'){
    const {challengeDemon}=await import('/src/combat/demon.js');s.floor=9;s.room=1;challengeDemon(s);
    s.floors[9][1].used=true;s.floors[9][1].enemies=[];s.floor=0;s.room=0;
   }
   s.key=true;const room=s.floors[0][0];room.enemies=[];Object.assign(s.player,objectPoint(room));
   localStorage.setItem(SAVE_KEY,encodeSave(s));
  },campaign);
  await page.reload();await page.locator('#continue').click();
  await page.locator('#interact').getByText('마지막 봉인',{exact:false}).waitFor();
  await page.locator('#interact').click();
  await page.waitForFunction(()=>document.querySelector('#objective')?.textContent?.includes('봉인 개방까지'));
  await page.screenshot({path:join(output,`${width}x${height}-${campaign}-active.png`)});
  const active=await page.evaluate(async()=>{const {parseSave,SAVE_KEY}=await import('/src/persistence/storage.js');const s=parseSave(localStorage.getItem(SAVE_KEY));return s.floors[0][0].finalEscape;});
  assert.equal(active.wave,1);assert.equal(active.ready,false);
  await page.locator('#pause').click();await page.locator('#resume').waitFor();await page.reload();await page.locator('#continue').click();
  await page.locator('#pause').click();await page.locator('#quit').click();await page.locator('#continue').waitFor();
  await page.evaluate(async()=>{
   const {parseSave,encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js');const s=parseSave(localStorage.getItem(SAVE_KEY));
   const room=s.floors[0][0];room.finalEscape.elapsed=35.8;room.finalEscape.wave=3;room.enemies=[];s.invulnerable=999;
   localStorage.setItem(SAVE_KEY,encodeSave(s));
  });
  await page.reload();await page.locator('#continue').click();
  try{await page.locator('#interact').getByText('열린 탈출구',{exact:false}).waitFor({timeout:5000});}
  catch(error){const details=await page.evaluate(()=>({interact:document.querySelector('#interact')?.textContent,hidden:document.querySelector('#interact')?.hidden,objective:document.querySelector('#objective')?.textContent,overlay:document.querySelector('#overlay')?.textContent.slice(0,120),state:(()=>{const raw=localStorage.getItem('spirebound.run.v1');if(!raw)return null;const run=JSON.parse(JSON.parse(raw).payload);return {floor:run.floor,room:run.room,player:run.player,final:run.floors[0][0].finalEscape};})()}));throw Error(`${error.message} ${JSON.stringify(details)}`);}
  await page.screenshot({path:join(output,`${width}x${height}-${campaign}-ready.png`)});
  await page.locator('#interact').click();await page.locator('.result-win').waitFor();
  assert.equal(await page.locator('.ranking-summary').count(),1,await page.locator('.result-win').innerText());
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  results.push({width,height,campaign,activeWave:active.wave,win:true});await context.close();
 }
 const context=await browser.newContext(),page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.goto(base);
 await page.evaluate(async()=>{
  const {newRun}=await import('/src/game/engine.js'),{encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js');
  const s=newRun(89);s.key=true;s.tutorialComplete=true;s.player.mainSkill='fire';s.player.fire=1;
  s.floors[0][0].finalEscape={elapsed:10,wave:1,ready:false};s.player.hp=1;s.entryGrace=0;
  s.projectiles=[{x:s.player.x,y:s.player.y,vx:0,vy:0,life:1,enemy:true,damage:9,hit:[],source:'마지막 추격'}];
  localStorage.setItem(SAVE_KEY,encodeSave(s));
 });
 await page.reload();await page.locator('#continue').click();await page.locator('.result-loss').waitFor();
 assert.equal(await page.locator('.ranking-summary').count(),0);await context.close();
 assert.deepEqual(errors,[]);console.log(JSON.stringify({results,deathNoRanking:true,pageErrors:errors.length}));
}finally{await browser.close();}
