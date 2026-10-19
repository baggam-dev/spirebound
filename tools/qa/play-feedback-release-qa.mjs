// Isolated saves only. Does not submit ranking scores or modify real player storage.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.BASE_URL||'http://127.0.0.1:5173',out=process.argv[2]||'docs/qa-feedback-20261020/local';
await mkdir(out,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],result={base,views:[]};
try{
 for(const [width,height] of [[1280,800],[844,390],[932,430],[740,360]]){
  const mobile=width<1000,cx=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile}),p=await cx.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.clock.install();await p.goto(base,{waitUntil:'domcontentloaded'});
  await p.evaluate(async()=>{
   const {newRun,currentRoom}=await import('/src/game/engine.js'),{encodeSave,SAVE_KEY}=await import('/src/persistence/storage.js'),{relics}=await import('/src/progression/relics.js');
   const s=newRun(31);s.tutorialComplete=true;s.invulnerable=999;s.entryGrace=999;s.attack=999;
   Object.assign(s.player,{level:12,mainSkill:'frost',frost:2,utility:'guardian',ultimate:1,rollMastery:1,sunFairy:1,snowFairy:1,stormFairy:1,fairyKing:1,relics:relics.map(r=>r.id).filter(id=>!['sunFairy','snowFairy','stormFairy'].includes(id)),potions:4});
   s.player.evolutions={ultimate:'burst',rollMastery:'slash'};const r=currentRoom(s);
   r.enemies=[{id:0,type:'archer',x:680,y:300,hp:10000,max:10000,cd:999,balanceVersion:1,slow:2,slowFactor:.7,frostStacks:2,frostStackTime:3}];
   localStorage.setItem(SAVE_KEY,encodeSave(s));
  });
  await p.reload({waitUntil:'domcontentloaded'});await p.locator('#continue').click();await p.clock.runFor(150);
  await p.evaluate(async()=>{await Promise.all([(await import('/src/rendering/hero-sprite.js')).heroSpriteReady,(await import('/src/rendering/companion-roll-art.js')).companionArtReady,(await import('/src/rendering/skill-icons.js')).skillIconsReady,(await import('/src/rendering/xp-shards.js')).xpShardsReady]);});
  assert.equal(await p.locator('#dodge').getAttribute('aria-label').then(v=>v?.includes('일섬')||!mobile),true);
  if(mobile){assert.equal(await p.locator('#dodge [data-skill-icon]').getAttribute('data-skill-icon'),'rollMastery:slash');}
  const layout=await p.evaluate(()=>{const box=id=>{const n=document.getElementById(id),r=n.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}};return {game:box('game'),left:box('mobileLeftRail'),right:box('mobileRightRail'),map:box('mobileMinimap'),pause:box('pause'),menu:box('mobileMenu'),relic:box('relicStrip'),relicInLeft:!!document.querySelector('#mobileLeftRail #relicStrip'),potionFont:getComputedStyle(document.querySelector('#potion .action-value')||document.getElementById('potion')).fontSize,stats:getComputedStyle(document.getElementById('statReadout')).fontSize,actions:['skill','potion','utility','dodge'].map(box)};});
  if(mobile){assert.ok(layout.game.h>=height-1,JSON.stringify(layout));assert.ok(layout.relicInLeft);assert.ok(layout.relic.right<=layout.game.x+1,JSON.stringify(layout));const controlsBottom=Math.max(layout.pause.bottom,layout.menu.bottom);assert.ok(layout.map.y>=controlsBottom&&layout.map.y-controlsBottom<=12);assert.ok(parseFloat(layout.potionFont)>=18);assert.ok(parseFloat(layout.stats)<=10);for(const r of layout.actions)assert.ok(r.x>=0&&r.right<=width+1&&r.bottom<=height+1);}
  await p.screenshot({path:join(out,`play-${width}.png`)});
  if(mobile)await p.locator('#dodge').tap();else await p.keyboard.press('Space');await p.clock.runFor(80);await p.screenshot({path:join(out,`slash-${width}.png`)});
  if(mobile)await p.locator('#mobileMenu').click();else await p.locator('#pause').click();await p.locator('#resume').waitFor();
  const saved=()=>p.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('spirebound.run.v1')).payload));const before=await saved();await p.clock.runFor(1500);const after=await saved();assert.equal(after.elapsed,before.elapsed,'menu must stop game');assert.equal(after.player.evolutions.rollMastery,'slash');
  const overlay=await p.locator('#overlay').boundingBox();if(mobile){assert.ok(overlay.y<=1&&overlay.height>=height-1);await p.screenshot({path:join(out,`menu-${width}.png`)});}
  let menuTools=false;if(mobile){await p.locator('#mobileMenuBag').click();await p.locator('#closeBag').waitFor();menuTools=true;await p.keyboard.press('Escape');}
  else await p.locator('#resume').click();await p.clock.runFor(300);result.views.push({width,height,layout,paused:true,slashSaved:true,menuTools});await cx.close();
 }
 const p=await browser.newPage();p.on('pageerror',e=>errors.push(e.message));await p.route('**/feedback-probe',r=>r.fulfill({contentType:'text/html',body:'<canvas width="960" height="540"></canvas>'}));await p.goto(base+'/feedback-probe');
 result.effects=await p.evaluate(async()=>{
  const {newRun,currentRoom}=await import('/src/game/engine.js'),{drawPassives}=await import('/src/progression/passives.js'),{drawOverhaulEffects}=await import('/src/rendering/skill-overhaul-effects.js'),{drawXpDrops,xpShardsReady}=await import('/src/rendering/xp-shards.js'),{drawSpellDetails}=await import('/src/rendering/pixel-world.js'),{companionArtReady}=await import('/src/rendering/companion-roll-art.js'),{environmentMaterial,ENVIRONMENT_PIXEL}=await import('/src/rendering/environment-material.js');
  if(!await xpShardsReady||!await companionArtReady)throw Error('effects PNG readiness');
  const s=newRun(31),r=currentRoom(s),c=document.querySelector('canvas').getContext('2d');s.elapsed=2;s.player.sunFairy=1;s.player.snowFairy=1;s.player.stormFairy=1;r.xpDrops=[1,3,9].map((tier,i)=>({tier,value:tier,id:i,x:330+i*24,y:300,fromX:330+i*24,fromY:300,born:0}));r.enemies=[{hp:10,x:650,y:300,slow:2,frostStacks:1}];s.roll={kind:'slash',elapsed:.12,duration:.28,x:1,y:0};
  const before=JSON.stringify(s);c.fillStyle='#222c2b';c.fillRect(0,0,960,540);drawPassives(c,s);drawOverhaulEffects(c,s);drawXpDrops(c,s,r);drawSpellDetails(c,r,s.elapsed);if(before!==JSON.stringify(s))throw Error('render mutation');
  const src=document.createElement('canvas');src.width=src.height=128;const g=src.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,64,128);g.fillStyle='#fff';g.fillRect(64,0,64,128);const m=environmentMaterial(src),d=m.getContext('2d').getImageData(0,0,m.width,m.height).data;let lo=255,hi=0;for(let i=0;i<d.length;i+=4){lo=Math.min(lo,d[i]);hi=Math.max(hi,d[i]);}if(hi-lo>80||ENVIRONMENT_PIXEL!==2)throw Error('contrast/grid');
  return {ready:true,stateUnchanged:true,pixel:ENVIRONMENT_PIXEL,contrastRange:[lo,hi],png:c.canvas.toDataURL('image/png').split(',')[1]};
 });await writeFile(join(out,'effects.png'),Buffer.from(result.effects.png,'base64'));delete result.effects.png;
 result.readability=await p.evaluate(async()=>{
  const {newRun,currentRoom}=await import('/src/game/engine.js'),{drawFloorMood}=await import('/src/rendering/atmosphere.js'),{drawStoneWalls,outerWalls}=await import('/src/rendering/stone-walls.js'),{drawPixelActor,drawSpellDetails}=await import('/src/rendering/pixel-world.js'),{drawHazards}=await import('/src/combat/poison.js'),{drawShadowAura,shadowAuraReady}=await import('/src/rendering/shadow-aura.js');
  await shadowAuraReady;await (await import('/src/rendering/archive-art.js')).loadArchiveArt();await (await import('/src/rendering/infested-hall-art.js')).loadInfestedHallArt();await (await import('/src/rendering/upper-hall-art.js')).loadRoyalHallArt();await (await import('/src/rendering/upper-hall-art.js')).loadInfernalHallArt();await (await import('/src/rendering/environment-art.js')).environmentArtReady;
  const c=document.querySelector('canvas').getContext('2d'),gallery=document.createElement('canvas');gallery.width=960;gallery.height=540*5;const g=gallery.getContext('2d');
  for(const [row,floor] of [0,2,4,6,8].entries()){const s=newRun(31),r=currentRoom(s);s.floor=floor;s.room=0;r.hazards=[{kind:'puddle',x:420,y:330,r:46,phase:'active',time:2,duration:2}];c.clearRect(0,0,960,540);drawFloorMood(c,s,r);drawStoneWalls(c,outerWalls,floor);drawHazards(c,r,2);const e={type:'archer',hp:10,x:610,y:300,slow:2,slowFactor:.7,frostStacks:0};drawShadowAura(c,e,2,{opacity:.45,width:76,height:70});drawPixelActor(c,e,2,s);drawSpellDetails(c,{enemies:[e]},2);g.drawImage(c.canvas,0,row*540);}
  const sample=document.createElement('canvas');sample.width=sample.height=40;const sc=sample.getContext('2d');drawSpellDetails(sc,{enemies:[{hp:10,x:20,y:68,slow:1,slowFactor:.7,frostStacks:0}]},0);if(!sc.getImageData(0,0,40,40).data.some((v,i)=>i%4===3&&v))throw Error('slow marker expired with frost stacks');
  return {themes:5,slowOutlastsStacks:true,png:gallery.toDataURL('image/png').split(',')[1]};
 });await writeFile(join(out,'readability.png'),Buffer.from(result.readability.png,'base64'));delete result.readability.png;await p.close();
 const fallback=await browser.newPage();fallback.on('pageerror',e=>errors.push(e.message));await fallback.route('**/environment-stone-reference-v1.png',r=>r.abort());await fallback.goto(base);result.referenceFallback=await fallback.evaluate(async()=>{const m=await import('/src/rendering/environment-material.js'),a=await import('/src/rendering/environment-art.js');return !(await m.environmentReferenceReady)&&await a.environmentArtReady&&a.environmentArtLoaded();});assert.ok(result.referenceFallback);await fallback.close();
 result.errors=errors;assert.deepEqual(errors,[]);await writeFile(join(out,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}
