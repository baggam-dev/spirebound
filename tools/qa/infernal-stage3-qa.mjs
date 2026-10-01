import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.SPIREBOUND_URL||'http://localhost:5173',output=process.argv[2]||'artifacts/infernal-stage3';
await mkdir(output,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
try{
 for(const [width,height,mobile] of [[1280,800,false],[390,844,true]])for(const floor of [5,6,7,8]){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  await page.goto(base);
  const expected=await page.evaluate(async floor=>{const {newRun}=await import('/src/game/engine.js'),{encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js');const s=newRun(419,{campaign:'expanded'});s.floor=floor;s.room=floor===8?1:s.floors[floor].findIndex(r=>r.type==='normal'&&r.enemies.length);s.player.x=480;s.player.y=270;s.tutorialComplete=true;const r=s.floors[floor][s.room],types=[...new Set(r.enemies.map(e=>e.type))];localStorage.setItem(SAVE_KEY,encodeSave(s));return {season:s.ranking.seasonId,types};},floor);
  await page.reload();await page.locator('#continue').click();await page.waitForFunction(f=>document.querySelector('#floor')?.textContent?.startsWith(`${f+1}층`),floor);
  await page.screenshot({path:join(output,`${width}x${height}-floor${floor+1}.png`)});
  const actual=await page.evaluate(async()=>{const {parseSave,SAVE_KEY}=await import('/src/persistence/storage.js');const s=parseSave(localStorage.getItem(SAVE_KEY));return {floor:s.floor,season:s.ranking.seasonId,types:[...new Set(s.floors[s.floor][s.room].enemies.map(e=>e.type))]};});
  assert.equal(actual.floor,floor);assert.equal(actual.season,'ASCENT-6');assert.equal(expected.season,'ASCENT-6');if(floor===8)for(const type of ['demonSoldier','demonArcher','demonBat'])assert.ok(actual.types.includes(type),type);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await context.close();
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({viewports:2,floors:[6,7,8,9],infernalIntro:true,season:'ASCENT-6',offlineFixture:true,pageErrors:0}));
}finally{await browser.close();}
