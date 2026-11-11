// Execute only with an explicit deployment instruction. Does not submit scores.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const out=process.argv[2];if(!out)throw Error('Output directory required');await mkdir(out,{recursive:true});
const base=process.env.BASE_URL||'http://localhost:5173',reports=[],errors=[];let submissions=0;
const hook=`\nglobalThis.__bossQA={state:()=>s,reduced:v=>sound.update({reducedEffects:v}),async load(run){await lease.acquire();renderTitleScene=null;s=run;resetTransient();enterRoom(s);await prepareFloorAssets(s.floor,floorAssetOptions(s));resume();paused=true;},tick(){paused=false;update(1/60);paused=true;}};`;
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--mute-audio']});
try{
 for(const width of [1280,844])for(const reduced of [false,true]){
  const cx=await browser.newContext({viewport:{width,height:width===1280?800:390},isMobile:width===844,hasTouch:width===844}),page=await cx.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='POST'&&r.url().endsWith('/api/records'))submissions++;});
  await page.route('**/src/game/game.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+hook});});
  await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!globalThis.__bossQA);
  const remnant=await page.evaluate(async reduced=>{
   const {newRun}=await import('/src/game/engine.js'),{challengeDemon}=await import('/src/combat/demon.js'),{validateRun}=await import('/src/persistence/storage.js');
   const s=newRun(77,{campaign:'expanded',bossLayoutVersion:1});s.floor=7;s.room=s.floors[7].findIndex(r=>r.type==='boss');challengeDemon(s);s.attack=999;s.invulnerable=999;s.player.level=10;s.pendingLevels=0;
   await __bossQA.load(s);__bossQA.reduced(reduced);validateRun(s);const art=await import('/src/rendering/remnant-sprite.js');if(!art.remnantSpriteState().ready)throw Error('remnant fallback instead of new art');
   return {floor:s.floor,layout:s.bossLayoutVersion,parts:s.floors[7][s.room].enemies.map(e=>e.part),pressure:s.floors[7][s.room].demon.pressureVersion??null,actualReduced:(await __bossQA.reduced(reduced)).reducedEffects};
  },reduced);assert.equal(remnant.actualReduced,reduced);assert.equal(remnant.pressure,null);assert.deepEqual(remnant.parts,['hand','foot']);
  await page.screenshot({path:join(out,`remnant-${width}-${reduced}.png`)});
  const king=await page.evaluate(async reduced=>{
   const {newRun}=await import('/src/game/engine.js'),{challengeKing}=await import('/src/combat/upper-floors.js'),{validateRun}=await import('/src/persistence/storage.js');
   const s=newRun(77,{campaign:'expanded',bossLayoutVersion:1});s.floor=9;s.room=1;challengeKing(s);s.attack=999;s.invulnerable=999;
   await __bossQA.load(s);__bossQA.reduced(reduced);const e=s.floors[9][1].enemies[0];__bossQA.tick();e.hp=e.max*.29;__bossQA.tick();validateRun(s);
   const art=await import('/src/rendering/resurrected-king.js'),view=await import('/src/rendering/king-resurrection.js');if(!art.resurrectedKingState().ready)throw Error('king fallback instead of new art');
   for(let i=0;i<36;i++)__bossQA.tick();return {stage:e.kingStage,age:view.kingResurrectionAge(e),flag:e.resurrectionVersion,actualReduced:(await __bossQA.reduced(reduced)).reducedEffects};
  },reduced);assert.equal(king.stage,3);assert.equal(king.flag,1);assert.equal(king.actualReduced,reduced);assert.ok(king.age>.5&&king.age<.8);
  await page.screenshot({path:join(out,`resurrection-halo-${width}-${reduced}.png`)});
  const finished=await page.evaluate(async()=>{const v=await import('/src/rendering/king-resurrection.js');const s=__bossQA.state(),e=s.floors[9][1].enemies[0];for(let i=0;i<65;i++)__bossQA.tick();const age=v.kingResurrectionAge(e);const {encodeSave,parseSave}=await import('/src/persistence/storage.js');const restored=parseSave(encodeSave(s));v.clearKingResurrection();const cues=v.tickKingResurrection(restored.floors[9][1].enemies,1/60);return {age,transition:e.kingTransition,cues,layout:restored.bossLayoutVersion};});
  assert.equal(finished.age,null);assert.equal(finished.transition,0);assert.deepEqual(finished.cues,[]);assert.equal(finished.layout,1);
  await page.screenshot({path:join(out,`revived-king-${width}-${reduced}.png`)});reports.push({width,reduced,remnant,king,finished});await cx.close();
 }
 assert.deepEqual(errors,[]);assert.equal(submissions,0);await writeFile(join(out,'results.json'),JSON.stringify({reports,errors,submissions,actualDevice:false,audioListening:false},null,2));
}finally{await browser.close();}
