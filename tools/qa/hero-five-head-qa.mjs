import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {createServer} from '../../server.js';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const server=process.env.SPIREBOUND_URL?null:createServer(resolve('.'));if(server)await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=process.env.SPIREBOUND_URL||'http://127.0.0.1:'+server.address().port,output=process.argv[2];if(output)await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];let scenes=0;const before=execFileSync('git',['show','874ec03:src/rendering/hero.js'],{encoding:'utf8'});
try{
 const gallery=await browser.newPage({viewport:{width:1200,height:640}});gallery.on('pageerror',e=>errors.push(e.message));await gallery.route('**/hero-before.js',r=>r.fulfill({contentType:'text/javascript',body:before}));await gallery.route('**/hero-gallery',r=>r.fulfill({contentType:'text/html',body:'<canvas width="1200" height="640"></canvas>'}));await gallery.goto(base+'/hero-gallery');
 const visual=await gallery.evaluate(async()=>{const {drawHero,HERO_PROPORTIONS}=await import('/src/rendering/hero.js'),{drawHero:old}=await import('/hero-before.js');const c=document.querySelector('canvas').getContext('2d');c.fillStyle='#18232c';c.fillRect(0,0,1200,640);const bow=(c,x,y,pull)=>{c.strokeStyle='#d9b985';c.lineWidth=2;c.beginPath();c.moveTo(x,y-15);c.lineTo(x+6,y-9);c.lineTo(x+8,y);c.lineTo(x+6,y+9);c.lineTo(x,y+15);c.stroke();c.strokeStyle='#eee1c5';c.lineWidth=1;c.beginPath();c.moveTo(x,y-15);c.lineTo(x-pull,y);c.lineTo(x,y+15);c.stroke();};
 const poses=[{moving:false,walk:0,recoil:0},{moving:true,walk:1.2,recoil:0},{moving:true,walk:1.2,recoil:0},{moving:false,walk:0,recoil:1}];for(const [row,draw] of [old,drawHero].entries()){c.fillStyle='#e7dfc5';c.font='20px sans-serif';c.fillText(row?'NEW / FIVE-HEAD PROPORTIONS':'CURRENT / LARGE-HEAD PROPORTIONS',32,row?355:35);for(const [i,p] of poses.entries()){c.save();c.translate(150+i*285,row?520:240);c.scale(i===2?-3:3,3);draw(c,p,.2,bow);c.restore();c.fillStyle='#b4c6cc';c.font='16px sans-serif';c.fillText(['idle','walk right','walk left','release'][i],110+i*285,row?613:318);}}
 const probe=document.createElement('canvas');probe.width=120;probe.height=120;const ctx=probe.getContext('2d'),p=poses[0],snap=JSON.stringify(p);ctx.fillStyle='#abc';drawHero(ctx,p,0,bow);const current=probe.toDataURL();ctx.clearRect(0,0,120,120);old(ctx,p,0,bow);const previous=probe.toDataURL();ctx.clearRect(0,0,120,120);drawHero(ctx,poses[1],.2,bow);if(current===previous||current===probe.toDataURL())throw Error('Missing silhouette or gait change');if(JSON.stringify(p)!==snap)throw Error('Pose mutated');return {proportions:HERO_PROPORTIONS,poses:4,stateUnchanged:true};});assert.equal(visual.proportions.height/visual.proportions.headHeight,5);if(output)await gallery.screenshot({path:join(output,'comparison.png')});await gallery.close();
 for(const [width,height,mobile] of [[1280,800,false],[844,390,true],[390,844,true]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await context.route('**/api/**',r=>r.abort());
  for(const scene of ['idle','walk','release','old']){
   await page.goto(base);await page.evaluate(async(scene)=>{
    const {newRun}=await import('/src/game/engine.js'),{encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js');const s=newRun(52);s.room=1;s.tutorialComplete=true;s.player.mainSkill='precision';s.player.precision=1;s.player.x=450;s.player.y=300;s.attack=scene==='release'?0:999;
    if(scene==='old'){s.generationVersion=27;s.ranking.seasonId='BETA-3';s.ranking.rulesVersion='ranking-v7';}
    const r=s.floors[0][1];r.enemies=scene==='release'?[{id:0,type:'archer',x:710,y:300,hp:1000,max:1000,cd:99,tier:0}]:[];r.seen=true;localStorage.setItem(SAVE_KEY,encodeSave(s));
   },scene);
   await page.reload();await page.bringToFront();await page.locator('#continue').click();await page.evaluate(()=>document.fonts.ready);
   for(let i=0;i<3;i++){if(await page.locator('#resume').isVisible())await page.locator('#resume').click();await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));if(!await page.locator('#resume').isVisible())break;}
   if(scene==='walk'){await page.keyboard.down('ArrowRight');await page.waitForTimeout(180);await page.keyboard.up('ArrowRight');}else await page.waitForTimeout(150);
   await page.keyboard.press('Escape');await page.locator('#journal').waitFor();const data=await page.evaluate(async()=>{const {parseSave,SAVE_KEY}=await import('/src/persistence/storage.js');const s=parseSave(localStorage.getItem(SAVE_KEY));return {elapsed:s.elapsed,x:s.player.x,hp:s.player.hp,generation:s.generationVersion,shots:s.projectiles.filter(b=>!b.enemy).length};});assert.ok(data.elapsed>0);assert.equal(data.generation,scene==='old'?27:34);assert.equal(data.hp,5);if(scene==='walk')assert.ok(data.x>450);if(scene==='release')assert.ok(data.shots>0);await page.evaluate(()=>document.querySelector('#overlay').style.visibility='hidden');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));if(output)await page.screenshot({path:join(output,scene+'-'+width+'.png'),animations:'disabled'});scenes++;
  }
  await context.close();
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({scenes,visual,saveResume:true,legacyPreserved:true,pageErrors:0,productionRecordsSubmitted:0}));
}finally{await browser.close();if(server)await new Promise(r=>server.close(r));}
