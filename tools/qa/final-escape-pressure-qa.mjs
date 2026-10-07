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
  for(const scene of ['opening','rush','late','ready','old','old-ready']){
   await page.goto(base);await page.evaluate(async(scene)=>{
    const {newRun,enrage,currentRoom}=await import('/src/game/engine.js'),{encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js'),{startFinalEscape,tickFinalEscape}=await import('/src/world/final-escape.js'),{stepRun}=await import('/src/game/simulation.js');
    const s=newRun(112,{campaign:'expanded'});if(scene.startsWith('old')){s.generationVersion=33;s.ranking.gameVersion='0.37.0-prebeta';}enrage(s);const r=currentRoom(s);r.enemies=[];r.returnSealReleased=true;s.player.mainSkill='precision';s.player.precision=1;s.player.hp=s.player.max=10;s.invulnerable=999;s.attack=999;s.tutorialComplete=true;s.returnNoticePending=false;startFinalEscape(s,r);
    const seconds=scene==='rush'?12:scene==='late'?32:scene.includes('ready')?36:scene==='old'?12:0;
    for(let i=0;i<seconds*10;i++)stepRun(s,.1,{x:Math.cos(i/25),y:Math.sin(i/25)});if(seconds===36)stepRun(s,.001);
    localStorage.setItem(SAVE_KEY,encodeSave(s));
   },scene);
   await page.reload();await page.bringToFront();await page.locator('#continue').click();await page.evaluate(()=>document.fonts.ready);
   for(let i=0;i<3;i++){if(await page.locator('#resume').isVisible())await page.locator('#resume').click();await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.waitForTimeout(150);if(!await page.locator('#resume').isVisible())break;}
   await page.keyboard.press('Escape');await page.locator('#journal').waitFor();const data=await page.evaluate(async()=>{const {parseSave,SAVE_KEY}=await import('/src/persistence/storage.js'),{currentRoom,canEscape,roomLocked}=await import('/src/game/engine.js');const s=parseSave(localStorage.getItem(SAVE_KEY)),r=currentRoom(s);return {elapsed:s.elapsed,state:r.finalEscape,locked:roomLocked(s),escape:canEscape(s),alive:r.enemies.filter(e=>e.hp>0).length,generation:s.generationVersion};});
   assert.ok(data.elapsed>(scene==='rush'||scene==='old'?12:scene==='late'?32:scene.includes('ready')?36:0),'Live continuation failed: '+scene+' '+width);assert.equal(data.generation,scene.startsWith('old')?33:34);assert.equal(data.state.pressureVersion,scene.startsWith('old')?undefined:1);assert.equal(data.locked,!scene.includes('ready'));assert.equal(data.escape,scene.includes('ready'));assert.ok(data.alive<=24);if(scene.includes('ready'))assert.equal(data.alive,0);if(scene==='late')assert.equal(data.state.wave,9);if(scene==='opening')assert.ok(data.state.pending.length>0);await page.evaluate(()=>document.querySelector('#overlay').style.visibility='hidden');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));if(output)await page.screenshot({path:join(output,scene+'-'+width+'.png'),animations:'disabled'});scenes++;
  }
  await context.close();
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({scenes,saveResume:true,cap:24,lateWave:9,readyExit:true,legacyPreserved:true,pageErrors:0,productionRecordsSubmitted:0}));
}finally{await browser.close();if(server)await new Promise(r=>server.close(r));}
