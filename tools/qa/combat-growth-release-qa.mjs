// Isolated browser fixtures. The debug hook is appended to the served module only.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.BASE_URL||'http://localhost:5173',out=process.argv[2];await mkdir(out,{recursive:true});
const hook=`\nconst qaClear=await import('/src/rendering/boss-clear.js');globalThis.__combatQA={clear:()=>qaClear.bossClearState(s),state:()=>s,mode:()=>mode,pause:()=>pause(),resume:()=>resume(),save:()=>save(),reduced:v=>{sound.settings.reducedEffects=v;},async load(run){await lease.acquire();renderTitleScene=null;s=run;resetTransient();enterRoom(s);await prepareFloorAssets(s.floor,floorAssetOptions(s));resume();}};`;
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],reports=[];let scores=0;
try{
 for(const width of (process.env.EXTRA_ONLY?[]:[1280,844]))for(const reduced of [false,true]){
  const cx=await browser.newContext({viewport:{width,height:width===1280?800:390},isMobile:width<1000,hasTouch:width<1000}),p=await cx.newPage();p.setDefaultTimeout(120000);
  p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(r.method()==='POST'&&r.url().endsWith('/api/records'))scores++;});
  await p.route('**/src/game/game.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+hook});});
  await p.goto(base,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!!globalThis.__combatQA);
  const setup=await p.evaluate(async reduced=>{
   const {newRun,currentRoom}=await import('/src/game/engine.js');const s=newRun(31);s.floor=1;s.room=s.floors[1].findIndex(r=>r.type==='boss');s.tutorialComplete=true;s.invulnerable=999;s.attack=999;s.player.mainSkill='fire';s.player.fire=1;s.player.rollMastery=1;s.player.evolutions={rollMastery:'slash'};s.player.x=420;s.player.y=330;
   const r=currentRoom(s);r.seen=true;r.obstacles=[];r.enemies[0].hp=r.enemies[0].max=99999;r.enemies[0].x=600;r.enemies[0].y=240;r.enemies[0].cd=999;
   await __combatQA.load(s);__combatQA.reduced(reduced);
   const h=await import('/src/rendering/companion-roll-art.js'),w=await import('/src/rendering/warden-walk.js');return {hero:h.dashArtState(),warden:w.wardenWalkState()};
  },reduced);assert.equal(setup.hero.frames,4);assert.equal(setup.warden.frames,8);
  // Render all approved phases from the actual runtime crop caches.
  const gallery=await p.evaluate(async()=>{
   const {drawRollHero}=await import('/src/rendering/companion-roll-art.js'),{drawWardenWalk}=await import('/src/rendering/warden-walk.js');const c=document.createElement('canvas');c.width=960;c.height=460;c.id='motion-gallery';const g=c.getContext('2d');g.fillStyle='#202832';g.fillRect(0,0,960,460);g.font='16px monospace';g.fillStyle='#eee';g.fillText('DRAW DASH: 4 PHASES / WALK: 8 PHASES',20,25);
   for(let i=0;i<4;i++)drawRollHero(g,{player:{x:120+i*230,y:140},roll:{kind:'slash',elapsed:[.02,.07,.16,.25][i],duration:.28,x:1,y:0}});
   for(let i=0;i<8;i++){g.save();g.translate(60+i*120,350);drawWardenWalk(g,{moving:true,walk:(i+.1)*Math.PI/4});g.restore();}return c.toDataURL().split(',')[1];
  });await writeFile(join(out,`motion-${width}-${reduced}.png`),Buffer.from(gallery,'base64'));
  await p.keyboard.down('d');await p.waitForTimeout(80);await p.keyboard.press('Space');await p.waitForTimeout(65);await p.keyboard.up('d');await p.screenshot({path:join(out,`dash-${width}-${reduced}.png`)});
  await p.waitForTimeout(300);await p.evaluate(()=>{const s=__combatQA.state(),r=s.floors[s.floor][s.room];r.enemies.forEach(e=>{e.hp=0;});});
  await p.waitForFunction(()=>__combatQA.clear()?.age>.2);
  const boss=await p.evaluate(()=>{const s=__combatQA.state(),r=s.floors[s.floor][s.room],image=document.querySelector('#game').toDataURL().split(',')[1];__combatQA.pause();return {xp:r.xpDroppedTotal,used:r.used,age:__combatQA.clear().age,image};});assert.equal(boss.xp,180);assert.equal(boss.used,true);
  await writeFile(join(out,`clear-active-${width}-${reduced}.png`),Buffer.from(boss.image,'base64'));delete boss.image;
  await p.evaluate(()=>__combatQA.pause());const age=await p.evaluate(async()=> (await import('/src/rendering/boss-clear.js')).bossClearState(__combatQA.state()).age);await p.waitForTimeout(150);assert.equal(await p.evaluate(async()=> (await import('/src/rendering/boss-clear.js')).bossClearState(__combatQA.state()).age),age);
  await p.screenshot({path:join(out,`clear-${width}-${reduced}.png`)});
  // A reward modal advances only the presentation clock, while world time stops.
  const modal=await p.evaluate(()=>{__combatQA.state().player.level=2;__combatQA.state().pendingLevels=1;__combatQA.state().levelQueue=[2];__combatQA.resume();});
  await p.waitForFunction(()=>['level','main'].includes(__combatQA.mode()));const clock=await p.evaluate(()=>__combatQA.state().elapsed);await p.waitForTimeout(180);assert.equal(await p.evaluate(()=>__combatQA.state().elapsed),clock);
  assert.ok(await p.evaluate(async()=> (await import('/src/rendering/boss-clear.js')).bossClearState(__combatQA.state()).age>0));
  // Save with unclaimed shards, re-open without replaying the clear event.
  await p.evaluate(()=>__combatQA.save());await p.reload({waitUntil:'domcontentloaded'});await p.locator('#continue').click();await p.waitForFunction(()=>!!__combatQA.state());
  assert.equal(await p.evaluate(async()=> (await import('/src/rendering/boss-clear.js')).bossClearState(__combatQA.state())),null);
  const descent=await p.evaluate(async()=>{
   const {newRun,currentRoom,enrage}=await import('/src/game/engine.js');const s=newRun(31);s.tutorialComplete=true;s.attack=999;s.invulnerable=999;s.player.mainSkill='fire';s.player.fire=1;s.player.x=150;s.player.y=350;enrage(s);const r=currentRoom(s);r.enemies=[{id:0,type:'chaser',x:700,y:250,hp:100,max:100,cd:999}];r.obstacles=[];r.seen=true;
   await __combatQA.load(s);r.enemies[0].hp=0;return true;
  });await p.waitForFunction(()=>{const s=__combatQA.state();return s.floors[s.floor][s.room].xpDroppedTotal===12;});
  const returnXp=await p.evaluate(()=>{const s=__combatQA.state(),r=s.floors[s.floor][s.room];return r.xpDroppedTotal;});assert.equal(returnXp,12);
  reports.push({width,reduced,...setup,boss,returnXp,pauseStable:true,modalWorldPaused:true,saveNoReplay:true});await cx.close();
 }
 // Optional art failure must preserve the original roll and walking fallback.
 const cx=await browser.newContext(),p=await cx.newPage();p.on('pageerror',e=>errors.push(e.message));await p.route(/\/(hero-draw-dash-v2|warden-walk-v2)\.png$/,r=>r.abort());await p.goto(base,{waitUntil:'domcontentloaded'});
 const fallback=await p.evaluate(async()=>{const a=await import('/src/rendering/asset-requests.js'),m=await import('/src/rendering/asset-manifest.js');a.activateAssetFiles([...m.assetFiles['companion-roll-art'],...m.assetFiles['warden-walk']]);const h=await import('/src/rendering/companion-roll-art.js'),w=await import('/src/rendering/warden-walk.js');await Promise.all([h.companionArtReady,w.wardenWalkReady]);return {hero:h.dashArtState(),warden:w.wardenWalkState()};});assert.equal(fallback.hero.ready,false);assert.equal(fallback.warden.frames,4);await cx.close();
 // Actual Canvas: full-screen coverage, context restoration, freeze and reduced load.
 const extra=await browser.newContext({viewport:{width:1280,height:800}}),q=await extra.newPage();q.on('pageerror',e=>errors.push(e.message));
 await q.route('**/src/game/game.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+hook});});await q.goto(base,{waitUntil:'domcontentloaded'});await q.waitForFunction(()=>!!globalThis.__combatQA);
 const canvas=await q.evaluate(async()=>{
  const m=await import('/src/rendering/boss-clear.js'),c=document.createElement('canvas');c.width=960;c.height=540;const g=c.getContext('2d',{willReadFrequently:true}),run={},r={};g.globalAlpha=.7;g.lineWidth=3;g.setLineDash([2,5]);const snapshot=()=>JSON.stringify([g.globalAlpha,g.lineWidth,g.getLineDash(),g.getTransform().toString(),g.fillStyle,g.strokeStyle]);const saved=snapshot();m.startBossClear(run,r,{x:480,y:270});for(let i=0;i<5;i++)m.advanceBossClear(run,r,.1);
  const counts=[];for(const reduced of [false,true]){g.clearRect(0,0,960,540);m.drawBossClear(g,run,r,{reduced});assertState(snapshot()===saved,'canvas restoration');const d=g.getImageData(0,0,960,540).data;let count=0,edge=0;for(let y=0;y<540;y++)for(let x=0;x<960;x++)if(d[(y*960+x)*4+3]){count++;if(x<20||x>940||y<20||y>520)edge++;}assertState(edge>0,'screen edges untouched');counts.push(count);}
  assertState(counts[1]<counts[0],'reduced load');function assertState(v,msg){if(!v)throw Error(msg);}return {restored:true,edgeCoverage:true,counts};
 });
 await q.evaluate(async()=>{const {newRun,currentRoom}=await import('/src/game/engine.js');const s=newRun(31);s.floor=7;s.room=s.floors[7].findIndex(r=>r.type==='boss');s.tutorialComplete=true;s.invulnerable=999;s.attack=999;s.player.mainSkill='fire';s.player.fire=1;s.player.x=200;s.player.y=380;const r=currentRoom(s);r.seen=true;r.obstacles=[];r.enemies=[{id:0,type:'boss',variant:'king',hp:9999,max:9999,x:600,y:240,cd:999}];await __combatQA.load(s);});
 await q.waitForFunction(()=>__combatQA.mode()==='play');await q.evaluate(()=>__combatQA.state().floors[7][__combatQA.state().room].enemies.forEach(e=>e.hp=0));await q.waitForFunction(()=>__combatQA.clear()?.age>.2);
 const final=await q.evaluate(()=>{const s=__combatQA.state(),r=s.floors[7][s.room];return {key:s.key,xp:r.xpDroppedTotal,age:__combatQA.clear().age,mode:__combatQA.mode()};});assert.equal(final.key,true);assert.equal(final.xp,360);await q.screenshot({path:join(out,'final-clear.png')});await extra.close();
 assert.deepEqual(errors,[]);assert.equal(scores,0);await writeFile(join(out,'result.json'),JSON.stringify({base,reports,fallback,canvas,final,errors,scoreSubmissions:scores},null,2));console.log(JSON.stringify({reports,fallback,canvas,final,errors,scoreSubmissions:scores}));
}finally{await browser.close();}
