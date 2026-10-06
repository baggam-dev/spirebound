import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createServer} from '../../server.js';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const server=process.env.SPIREBOUND_URL?null:createServer(resolve('.'));if(server)await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=process.env.SPIREBOUND_URL||'http://127.0.0.1:'+server.address().port,output=process.argv[2];if(output)await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],metrics=[];
try{
 for(const [width,height,mobile] of [[1280,800,false],[844,390,true],[390,844,true]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await context.route('**/api/**',route=>route.abort());await page.goto(base);
  if(width===1280)metrics.push(...await page.evaluate(async()=>{
   const {newRun,currentRoom}=await import('/src/game/engine.js'),{challengeCommander,updateCommander}=await import('/src/combat/commander.js'),{encodeSave,parseSave}=await import('/src/persistence/storage.js');const rows=[];
   for(const legacy of [true,false])for(const phase of [1,2]){const s=newRun(77,{campaign:'expanded'});if(legacy){s.generationVersion=30;s.ranking.gameVersion='0.34.0-prebeta';}s.floor=8;s.room=s.floors[8].findIndex(r=>r.type==='boss');challengeCommander(s);const r=currentRoom(s),e=r.enemies[0],c=e.commander;if(phase===2){e.hp=e.max*.4;c.phase=2;}let walk=0,shots=0,maxBullets=0;const counts={};for(let i=0;i<3600;i++){const x=e.x,y=e.y,was={};for(const k of ['volley','rain','blink','snipe','ricochet'])was[k]=c[k];s.player.x=480+Math.sin(i/240)*200;s.player.y=350+Math.cos(i/300)*70;const b=[];updateCommander(e,s.player,r,1/60,b,()=>{});shots+=b.length;maxBullets=Math.max(maxBullets,b.length);const distance=Math.hypot(e.x-x,e.y-y);if(distance<20)walk+=distance;for(const k of Object.keys(was))if(c[k]&&c[k]!==was[k])counts[k]=(counts[k]||0)+1;if(i%60===0)parseSave(encodeSave(s));}rows.push({legacy,phase,seconds:60,walk:Math.round(walk),shots,maxBullets,counts});}return rows;
  }));
  for(const [boss,phase,legacy] of [['king',3,false],['commander',1,false],['commander',2,false],['king',3,true],['commander',1,true]]){
   await page.goto(base);
   await page.evaluate(async({boss,phase,legacy})=>{const {newRun}=await import('/src/game/engine.js'),{encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js'),{challengeCommander}=await import('/src/combat/commander.js'),{challengeKing}=await import('/src/combat/upper-floors.js');const s=newRun(99,{campaign:'expanded'});if(legacy){s.generationVersion=30;s.ranking.gameVersion='0.34.0-prebeta';}s.floor=boss==='king'?7:8;s.room=s.floors[s.floor].findIndex(r=>r.type==='boss');const r=s.floors[s.floor][s.room];r.enemies=[];if(boss==='king')challengeKing(s);else challengeCommander(s);const e=r.enemies[0];if(boss==='king'){e.hp=e.max*.25;e.kingStage=3;}else if(phase===2){e.hp=e.max*.4;e.commander.phase=2;}s.player.mainSkill='frost';s.player.frost=4;s.player.max=s.player.hp=20;s.player.x=480;s.player.y=435;s.tutorialComplete=true;s.invulnerable=99;localStorage.setItem(SAVE_KEY,encodeSave(s));},{boss,phase,legacy});
   await page.reload();await page.locator('#continue').click();await page.waitForTimeout(900);await page.keyboard.press('Escape');await page.locator('#journal').waitFor();
   const saved=await page.evaluate(async()=>{const {parseSave,SAVE_KEY}=await import('/src/persistence/storage.js');const s=parseSave(localStorage.getItem(SAVE_KEY)),e=s.floors[s.floor][s.room].enemies.find(e=>e.type==='boss');return {generation:s.generationVersion,pressure:e.bossPressureVersion};});assert.equal(saved.generation,legacy?30:31);assert.equal(saved.pressure,legacy?undefined:1);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await page.evaluate(()=>{document.querySelector('#overlay').style.visibility='hidden';});if(output)await page.screenshot({path:join(output,`${boss}-${phase}-${legacy?'old':'new'}-${width}.png`)});
  }
  await context.close();
 }
 for(const phase of [1,2]){const old=metrics.find(r=>r.legacy&&r.phase===phase),now=metrics.find(r=>!r.legacy&&r.phase===phase);assert.ok(now.shots>old.shots);assert.ok(now.walk>old.walk);assert.ok(now.counts.blink>old.counts.blink);assert.ok(now.counts.rain>old.counts.rain);assert.ok(now.counts.ricochet>0);}
 assert.deepEqual(errors,[]);console.log(JSON.stringify({scenes:15,metrics,oldSaveRulesPreserved:true,saveResume:true,pageErrors:0,productionRecordsSubmitted:0}));
}finally{await browser.close();if(server)await new Promise(r=>server.close(r));}
