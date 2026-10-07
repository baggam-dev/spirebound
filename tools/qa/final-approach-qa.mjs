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
  for(const scene of ['near','fountain','unlocked','old','notice','old-notice']){
   await page.goto(base);await page.evaluate(async(scene)=>{
    const {newRun,enrage,currentRoom}=await import('/src/game/engine.js'),{encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js'),{stepRun}=await import('/src/game/simulation.js');
    const s=newRun(112,{campaign:'expanded'});if(scene.startsWith('old')){s.generationVersion=32;s.ranking.gameVersion='0.36.0-prebeta';}enrage(s);s.room=scene==='near'?1:2;s.player.mainSkill='precision';s.player.precision=1;s.player.hp=s.player.max=10;s.invulnerable=999;s.attack=999;s.tutorialComplete=true;
    if(scene.includes('notice')){s.floor=9;s.room=1;s.returnNoticePending=true;}else s.returnNoticePending=false;
    if(scene==='unlocked'){currentRoom(s).enemies.find(e=>e.id===currentRoom(s).returnGuardianId).hp=0;stepRun(s,.001);}
    localStorage.setItem(SAVE_KEY,encodeSave(s));
   },scene);
   await page.reload();await page.bringToFront();await page.locator('#continue').click();await page.evaluate(()=>document.fonts.ready);
   if(scene.includes('notice')){await page.locator('#beginReturn').waitFor();const text=await page.locator('#overlay').innerText();assert.equal(text.includes('모든 접근 경로'),scene==='notice');assert.equal(text.includes('방문한 방도 30%'),scene==='old-notice');}
   else{
    for(let i=0;i<3;i++){if(await page.locator('#resume').isVisible())await page.locator('#resume').click();await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.waitForTimeout(150);if(!await page.locator('#resume').isVisible())break;}
    await page.keyboard.press('Escape');await page.locator('#journal').waitFor();const data=await page.evaluate(async()=>{const {parseSave,SAVE_KEY}=await import('/src/persistence/storage.js'),{currentRoom,roomLocked}=await import('/src/game/engine.js');const s=parseSave(localStorage.getItem(SAVE_KEY)),r=currentRoom(s);return {elapsed:s.elapsed,depth:r.finalApproachDepth,seal:r.returnSeal,locked:roomLocked(s),released:r.returnSealReleased,living:r.enemies.filter(e=>e.hp>0).length,generation:s.generationVersion};});
    assert.ok(data.elapsed>0);assert.equal(data.generation,scene==='old'?32:34);assert.equal(data.depth,scene==='old'?undefined:scene==='near'?1:2);assert.equal(data.seal,scene==='old'?'clear':'guardian');assert.equal(data.locked,scene!=='unlocked');if(scene==='unlocked'){assert.equal(data.released,true);assert.ok(data.living>0);}await page.evaluate(()=>document.querySelector('#overlay').style.visibility='hidden');
   }
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));if(output)await page.screenshot({path:join(output,scene+'-'+width+'.png')});scenes++;
  }
  await context.close();
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({scenes,saveResume:true,guardianOnlyUnlock:true,legacyPreserved:true,notice:true,pageErrors:0,productionRecordsSubmitted:0}));
}finally{await browser.close();if(server)await new Promise(r=>server.close(r));}
