import assert from 'node:assert/strict';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.SPIREBOUND_URL||'http://localhost:5173';
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
try{
 for(const [width,height,mobile] of [[1280,800,false],[844,390,true]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base);await page.locator('#start').click();
  assert.match(await page.locator('#overlay').innerText(),/BETA-5.*ASCENT-7/s);
  const state=await page.evaluate(async()=>{
   const {newRun,currentRoom}=await import('/src/game/engine.js');
   const {stepRun}=await import('/src/game/simulation.js');
   const {encodeSave,parseSave}=await import('/src/persistence/storage.js');
   const run=newRun(119);run.tutorialComplete=true;run.attack=999;
   Object.assign(run.player,{x:120,y:200,split:1,pierce:1});
   const room=currentRoom(run);room.obstacles=[];
   room.enemies=[{id:1,type:'chaser',x:180,y:200,hp:500,max:500,cd:9,frozen:5,balanceVersion:1},{id:2,type:'chaser',x:260,y:250,hp:500,max:500,cd:9,frozen:5,balanceVersion:1}];
   run.projectiles=[{x:120,y:200,vx:420,vy:0,enemy:false,elemental:true,damageScale:1,life:3,pierce:1,hit:[]}];
   for(let i=0;i<8;i++)stepRun(run,1/60);
   const resumed=parseSave(encodeSave(run));
   return {generation:run.generationVersion,season:run.ranking.seasonId,turned:run.projectiles[0]?.vy>0,resumedVy:resumed.projectiles[0]?.vy};
  });
  assert.equal(state.generation,29);assert.equal(state.season,'BETA-5');
  assert.equal(state.turned,true);assert.ok(state.resumedVy>0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await context.close();
 }
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({viewports:2,newSeason:true,stormTurnAndSave:true,pageErrors:0}));
}finally{await browser.close();}
