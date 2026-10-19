import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.BASE_URL||'http://127.0.0.1:5174',out=process.argv[2];await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],results=[];
try{
 for(const fallback of [false,true]){
  const ctx=await browser.newContext(),p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/xp-preview',r=>r.fulfill({contentType:'text/html',body:'<canvas width="960" height="540"></canvas>'}));
  if(fallback)await p.route('**/xp-shards-atlas-v1.png',r=>r.abort());await p.goto(base+'/xp-preview');
  const result=await p.evaluate(async fallback=>{
   const x=await import('/src/rendering/xp-shards.js'),v=await import('/src/rendering/interaction-visuals.js');const ready=await x.xpShardsReady;
   const check=(b,m)=>{if(!b)throw Error(m);};check(ready===!fallback,'atlas readiness');
   const c=document.querySelector('canvas').getContext('2d',{willReadFrequently:true});const s={elapsed:1,player:{x:480,y:270}},r={xpDrops:[1,3,9].map((tier,i)=>({tier,value:tier,x:350+i*130,y:110,fromX:350+i*130,fromY:110,born:0,attract:false}))};
   const snapshot=JSON.stringify({s,r});c.globalAlpha=.8;c.imageSmoothingEnabled=true;const state=()=>JSON.stringify([c.globalAlpha,c.imageSmoothingEnabled,c.fillStyle,c.font,c.getTransform().toString()]);const before=state();
   x.drawXpDrops(c,s,r);check(state()===before,'XP canvas leak');const pixels=c.getImageData(0,0,960,540).data;const widths=r.xpDrops.map(d=>{const xs=[];for(let y=70;y<140;y++)for(let xx=d.x-20;xx<d.x+20;xx++)if(pixels[(y*960+xx)*4+3])xs.push(xx);return Math.max(...xs)-Math.min(...xs)+1;});
   check(widths.every((w,i)=>w>0&&w<=[3,6,10][i]),'XP actual size');
   const paused=c.canvas.toDataURL();c.clearRect(0,0,960,540);x.drawXpDrops(c,s,r);check(paused===c.canvas.toDataURL(),'paused XP changed');
   const cases=[['shrine',{good:true}],['shrine',{good:false}],['pact',{choice:'blood'}],['pact',{choice:'supply'}],['pact',{choice:'trial'}],['essence',{color:'#d4a1ff'}],['level',{level:2}],['stairs',{direction:1}],['stairs',{direction:-1}]];
   const gallery=document.createElement('canvas');gallery.width=960;gallery.height=600;const g=gallery.getContext('2d');g.fillStyle='#303837';g.fillRect(0,0,960,600);g.drawImage(c.canvas,0,0);
   for(const [i,[kind,detail]] of cases.entries()){
    const run={elapsed:0,player:{x:480,y:270}},room={};v.emitInteraction(run,kind,room,{x:440,y:270,...detail});run.elapsed=.18;
    c.clearRect(0,0,960,540);v.drawInteractionEffects(c,run,room);check(c.getImageData(0,0,960,540).data.some(a=>a),'missing '+kind);check(state()===before,'effect canvas leak');
    const normal=c.canvas.toDataURL();c.clearRect(0,0,960,540);v.drawInteractionEffects(c,run,room);check(normal===c.canvas.toDataURL(),'pause '+kind);
    g.save();g.translate(i%3*320-320,Math.floor(i/3)*155-80);g.drawImage(c.canvas,0,0);g.restore();g.fillStyle='#eee1c1';g.font='12px monospace';g.fillText(kind+' '+JSON.stringify(detail),i%3*320+8,Math.floor(i/3)*155+40);
    c.clearRect(0,0,960,540);v.drawInteractionEffects(c,run,room,true);run.elapsed=.9;c.clearRect(0,0,960,540);v.drawInteractionEffects(c,run,room);check(!c.getImageData(0,0,960,540).data.some(a=>a),'expired '+kind);
   }
   check(JSON.stringify({s,r})===snapshot,'render mutated run');document.querySelector('canvas').replaceWith(gallery);
   return {ready,state:x.xpShardsState(),widths,pause:true,canvasRestored:true,immutable:true,effects:cases.length};
  },fallback);results.push({fallback,...result});await p.locator('canvas').screenshot({path:join(out,`gallery-${fallback?'fallback':'ready'}.png`)});await ctx.close();
 }
 for(const [width,height] of [[1280,800],[844,390]]){
  const ctx=await browser.newContext({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000}),p=await ctx.newPage();p.setDefaultTimeout(120000);p.on('pageerror',e=>errors.push(e.message));await p.goto(base,{waitUntil:'domcontentloaded'});
  await p.evaluate(async()=>{const {newRun,currentRoom}=await import('/src/game/engine.js'),{stepRun}=await import('/src/game/simulation.js'),{encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js');const s=newRun(31),r=currentRoom(s);s.tutorialComplete=true;s.attack=999;s.invulnerable=999;r.obstacles=[];r.enemies=[{id:0,type:'chaser',x:480,y:270,hp:0,max:100,xpReward:13}];s.player.x=380;s.player.y=270;stepRun(s,.01);if(s.player.xp!==0||r.xpDroppedTotal!==13)throw Error('kill not dropped');localStorage.setItem(SAVE_KEY,encodeSave(s));});
  await p.reload({waitUntil:'domcontentloaded'});await p.locator('#continue').click();const art=await p.evaluate(async()=>{const h=await import('/src/rendering/hero-sprite.js'),x=await import('/src/rendering/xp-shards.js');if(!await h.heroSpriteReady||!await x.xpShardsReady)throw Error('art');return h.heroSpriteState();});
  await p.waitForTimeout(220);await writeFile(join(out,`ground-${width}.png`),Buffer.from(await p.locator('#game').evaluate(c=>c.toDataURL().split(',')[1]),'base64'));
  await p.keyboard.down('ArrowRight');await p.waitForTimeout(600);await p.keyboard.up('ArrowRight');await p.waitForTimeout(200);await p.keyboard.press('Escape');
  const saved=await p.evaluate(async()=>{const {parseSave,SAVE_KEY}=await import('/src/persistence/storage.js');const s=parseSave(localStorage.getItem(SAVE_KEY)),r=s.floors[s.floor][s.room];return {xp:s.player.xp,left:r.xpDrops.reduce((n,d)=>n+d.value,0),collected:r.xpCollectedTotal,total:r.xpDroppedTotal};});assert.equal(saved.total,13);assert.ok(saved.collected>0);assert.equal(saved.left+saved.collected,13);assert.equal(saved.xp,saved.collected);
  await p.reload({waitUntil:'domcontentloaded'});const reloaded=await p.evaluate(async()=>{const {parseSave,SAVE_KEY}=await import('/src/persistence/storage.js');return parseSave(localStorage.getItem(SAVE_KEY)).player.xp;});assert.equal(reloaded,saved.xp);results.push({width,art,...saved,reload:true,touchEmulated:width<1000});await ctx.close();
 }
 assert.deepEqual(errors,[]);await writeFile(join(out,'result.json'),JSON.stringify({base,results,errors,productionRecordsSubmitted:0},null,2));console.log(JSON.stringify(results));
}finally{await browser.close();}
