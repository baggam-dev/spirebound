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
 for(const [width,height] of [[844,390],[740,360],[667,320]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await context.route('**/api/**',r=>r.abort());
  await page.goto(base);await page.evaluate(async()=>{
   const {newRun}=await import('/src/game/engine.js'),{encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js'),{relics}=await import('/src/progression/relics.js');
   const s=newRun(51);s.tutorialComplete=true;s.room=1;s.attack=999;s.floors[0][1].enemies=[];
   Object.assign(s.player,{level:8,mainSkill:'precision',precision:1,ultimate:1,evolutions:{ultimate:'turret'},utility:'focus',max:20,hp:18,potions:6,relics:relics.slice(0,32).map(r=>r.id),haste:1,split:1,pierce:1,aura:1,power:1});
   localStorage.setItem(SAVE_KEY,encodeSave(s));
  });await page.reload();await page.locator('#continue').click();if(await page.locator('#resume').isVisible())await page.locator('#resume').click();await page.waitForTimeout(200);
  const layout=await page.evaluate(()=>{
   const box=id=>{const r=document.getElementById(id).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};},xp=box('xpTrack'),circle=getComputedStyle(document.getElementById('stick'),'::before').borderRadius,game=box('game'),left=box('mobileLeftRail'),right=box('mobileRightRail'),stick=box('stick'),action=document.querySelector('.actions').getBoundingClientRect();
   return {game,left,right,stick,xp,circle,action:{x:action.x,y:action.y,right:action.right,bottom:action.bottom},icons:[...document.querySelectorAll('.actions button:not([hidden]) .action-icon svg')].length,touch:getComputedStyle(document.querySelector('header')).touchAction,overflow:document.documentElement.scrollWidth>innerWidth};
  });assert.ok(layout.left.right<=layout.game.x);assert.ok(layout.right.x>=layout.game.right);assert.ok(layout.stick.right<=layout.game.x);assert.ok(layout.action.x>=layout.game.right);assert.ok(layout.left.bottom<=layout.stick.y);assert.equal(layout.icons,4);assert.equal(layout.touch,'manipulation');assert.equal(layout.overflow,false);assert.ok(layout.xp.bottom<=height);assert.equal(layout.circle,'50%');
  if(output)await page.screenshot({path:join(output,'landscape-'+width+'.png')});scenes++;
  const scale=await page.evaluate(()=>visualViewport.scale);const game=await page.locator('#game').boundingBox();await page.touchscreen.tap(game.x+game.width/2,game.y+game.height/2);await page.touchscreen.tap(game.x+game.width/2,game.y+game.height/2);assert.equal(await page.evaluate(()=>visualViewport.scale),scale);
  // Exercise the real captured joystick, then rotate while the pointer is still down.
  const stick=await page.locator('#stick').boundingBox();await page.mouse.move(stick.x+stick.width/2,stick.y+stick.height/2);await page.mouse.down();await page.mouse.move(stick.x+stick.width/2+24,stick.y+stick.height/2);await page.waitForTimeout(200);
  // Reset capture and halt simulation on rotation; returning does not auto-resume.
  await page.setViewportSize({width:390,height:844});await page.locator('#resume').waitFor();
  const snapshot=()=>page.evaluate(async()=>{const {parseSave,SAVE_KEY}=await import('/src/persistence/storage.js');const s=parseSave(localStorage.getItem(SAVE_KEY));return {elapsed:s.elapsed,x:s.player.x,hp:s.player.hp};});
  const before=await snapshot();assert.ok(before.x>480);await page.mouse.up();await page.locator('#resume').click();await page.waitForTimeout(200);assert.deepEqual(await snapshot(),before);assert.equal(await page.locator('#game').isVisible(),false);
  await page.setViewportSize({width,height});await page.waitForTimeout(150);assert.deepEqual(await snapshot(),before);await page.locator('#resume').click();await page.keyboard.down('ArrowLeft');await page.waitForTimeout(200);await page.keyboard.up('ArrowLeft');await page.keyboard.press('Escape');await page.locator('#journal').waitFor();const after=await snapshot();assert.ok(after.elapsed>before.elapsed);assert.ok(after.x<before.x);assert.equal(after.hp,before.hp);scenes++;await context.close();
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({scenes,sideRails:true,activeIcons:true,portraitBlocked:true,manualResume:true,savedHealthPreserved:true,pageErrors:0,productionRecordsSubmitted:0}));
}finally{await browser.close();if(server)await new Promise(r=>server.close(r));}
