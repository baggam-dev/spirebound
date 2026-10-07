import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createServer} from '../../server.js';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const server=process.env.SPIREBOUND_URL?null:createServer(resolve('.'));if(server)await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=process.env.SPIREBOUND_URL||'http://127.0.0.1:'+server.address().port,output=process.argv[2];if(output)await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];let scenes=0;
try{
 for(const [width,height,mobile] of [[1280,800,false],[844,390,true],[390,844,true]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await context.route('**/api/**',r=>r.abort());
  for(const scene of ['recovery','blink','movement','old']){
   await page.goto(base);await page.evaluate(async(scene)=>{
    const {newRun}=await import('/src/game/engine.js'),{encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js');
    const s=newRun(5);s.room=4;s.tutorialComplete=true;s.player.mainSkill='precision';s.player.precision=1;s.attack=999;
    if(scene==='old'){s.generationVersion=27;s.ranking.seasonId='BETA-3';s.ranking.rulesVersion='ranking-v7';}
    s.floors[0][4].enemies.forEach((e,i)=>{e.x=500+i*20;e.y=240;});
    s.player.x=scene==='recovery'||scene==='old'?50:48;s.player.y=scene==='recovery'||scene==='old'?386.67:270;s.floors[0][4].seen=true;localStorage.setItem(SAVE_KEY,encodeSave(s));
   },scene);
   await page.reload();await page.bringToFront();await page.locator('#continue').click();await page.evaluate(()=>document.fonts.ready);
   for(let i=0;i<3;i++){if(await page.locator('#resume').isVisible())await page.locator('#resume').click();await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));if(!await page.locator('#resume').isVisible())break;}
   if(scene==='blink'||scene==='movement'){await page.keyboard.down('ArrowLeft');await page.keyboard.down('ArrowDown');if(scene==='blink')await page.keyboard.press('Space');await page.waitForTimeout(250);await page.keyboard.up('ArrowLeft');await page.keyboard.up('ArrowDown');}
   await page.waitForTimeout(scene==='blink'?500:150);await page.keyboard.press('Escape');await page.locator('#journal').waitFor();const data=await page.evaluate(async()=>{const {parseSave,SAVE_KEY}=await import('/src/persistence/storage.js'),{currentRoom}=await import('/src/game/engine.js'),{blocked}=await import('/src/world/terrain.js');const s=parseSave(localStorage.getItem(SAVE_KEY));return {elapsed:s.elapsed,x:s.player.x,y:s.player.y,hp:s.player.hp,room:s.room,generation:s.generationVersion,dodge:s.dodge,blocked:blocked(s.player.x,s.player.y,14,currentRoom(s).obstacles)};});
   assert.ok(data.elapsed>0);assert.equal(data.generation,scene==='old'?27:34);assert.equal(data.room,4);assert.equal(data.hp,5);assert.equal(data.blocked,false);if(scene==='blink')assert.ok(data.dodge>0);await page.evaluate(()=>document.querySelector('#overlay').style.visibility='hidden');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));if(output)await page.screenshot({path:join(output,scene+'-'+width+'.png'),animations:'disabled'});scenes++;
  }
  await context.close();
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({scenes,stuckSaveRecovery:true,liveDiagonalBlink:true,movement:true,legacyPreserved:true,pageErrors:0,productionRecordsSubmitted:0}));
}finally{await browser.close();if(server)await new Promise(r=>server.close(r));}
