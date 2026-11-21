import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.BASE_URL||'http://localhost:5173',out=process.argv[2];await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],reports=[];
try{
 for(const [width,height] of [[1280,800],[844,390]]){
  const cx=await browser.newContext({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000}),page=await cx.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/major-gallery',r=>r.fulfill({contentType:'text/html',body:'<body style="margin:0;background:#111922"><canvas width="960" height="540" style="width:100vw;height:auto;max-height:100vh;object-fit:contain"></canvas></body>'}));await page.goto(base+'/major-gallery');
  const result=await page.evaluate(async()=>{
   const [engine,assets,mood,decals,walls,world,seal,devices,actions,storage,sim,passives,ultimate]=await Promise.all(['/src/game/engine.js','/src/rendering/floor-assets.js','/src/rendering/atmosphere.js','/src/rendering/floor-decals.js','/src/rendering/stone-walls.js','/src/rendering/pixel-world.js','/src/rendering/seal-engine.js','/src/world/seal-engines.js','/src/rendering/grunt-actions.js','/src/persistence/storage.js','/src/game/simulation.js','/src/progression/passives.js','/src/combat/abilities.js'].map(p=>import(p)));
   await assets.prepareFloorAssets(0,{actors:[{type:'chaser'},{type:'archer'}],player:{sunFairy:1,snowFairy:1,stormFairy:1,fairyKing:1,ultimate:1}});
   const fairy=await import('/src/rendering/fairy-feedback.js');const assert=(v,m)=>{if(!v)throw Error(m);};let count=0;const kinds=new Set();
   for(let seed=1;seed<=30;seed++){const s=engine.newRun(seed);for(const rooms of s.floors)for(const r of rooms){s.floor=s.floors.indexOf(rooms);for(const key of [false,true]){s.key=key;const before=JSON.stringify(s),p=decals.floorDecalPlan(s,r);assert(p.items.length<=7,'decal cap');assert(JSON.stringify(p)===JSON.stringify(decals.floorDecalPlan(s,structuredClone(r))),'decal clone determinism');assert(before===JSON.stringify(s),'plan mutated run');for(const item of p.items){kinds.add(item.kind);count++;assert(!(item.x+item.radius>325&&item.x-item.radius<635&&item.y+item.radius>175&&item.y-item.radius<365),'central space');}}}}
   assert(kinds.size===6,'missing decal species');
   const s=engine.newRun(47),r=s.floors[0].find(r=>r.type==='normal');r.obstacles=[];r.doorPositions=[480,270,480,270];s.room=s.floors[0].indexOf(r);s.player.x=440;s.player.y=300;Object.assign(s.player,{sunFairy:1,snowFairy:1,stormFairy:1,fairyKing:1});
   r.enemies=[{id:0,type:'chaser',x:620,y:310,hp:100,max:100,cd:99},{id:1,type:'archer',x:720,y:220,hp:100,max:100,cd:99}];
   window.majorRender=(kind,reduced)=>{
    s.key=kind==='descent';s.elapsed=2;const c=document.querySelector('canvas').getContext('2d');c.clearRect(0,0,960,540);c.fillStyle='#18222b';c.fillRect(0,0,960,540);mood.drawFloorMood(c,s,r);decals.drawFloorDecals(c,s,r);walls.drawStoneWalls(c,walls.outerWalls,0);world.drawWorldDetails(c,s,r,reduced);
    const before=JSON.stringify(s);if(kind==='device'){r.sealEngine={version:1,x:70,y:130,direction:1,phase:'warning',time:.7,disarm:.6};seal.drawSealEngine(c,r);seal.drawSealEngineWarning(c,r,{reduced,player:{x:100,y:130}});delete r.sealEngine;}
    if(kind==='effects'){r.arrowRain={x:480,y:270,r:280,elapsed:1.55,pulses:6};passives.drawPassives(c,s,reduced);for(const [index,id] of ['sunFairy','snowFairy','stormFairy'].entries()){const b={x:200+index*120,y:430,vx:420,vy:0,life:1.98,passive:id,enemy:false};const v=fairy.fairyReleaseState({...s,projectiles:[b]},index,r);assert(v.strength>0,'fairy shot feedback');world.drawProjectile(c,b,2,s.player,reduced);fairy.drawFairyFeedback(c,index,b.x-28,b.y,v,reduced);}fairy.drawFairyKingBeam(c,{x:220,y:470,aim:0,time:.4},420,reduced);delete r.arrowRain;}
    world.drawPixelActor(c,{...s.player,type:'player'},s.elapsed,s,reduced);for(const e of r.enemies)world.drawPixelActor(c,e,s.elapsed,s,reduced);assert(JSON.stringify(s)===before,'renderer mutated run');
   };
   // Explicitly compare the approved decal kinds, including the rare ritual.
   const gallery=document.createElement('canvas');gallery.width=960;gallery.height=240;gallery.id='decal-gallery';gallery.style='width:100vw;display:none';document.body.append(gallery);const gc=gallery.getContext('2d');let slot=0;
   for(const kind of kinds){let found;for(let seed=1;seed<=200&&!found;seed++){const v=engine.newRun(seed);v.key=true;for(const rooms of v.floors)for(const room of rooms){v.floor=v.floors.indexOf(rooms);const p=decals.floorDecalPlan(v,room).items.find(p=>p.kind===kind);if(p){found={v,room,p};break;}}}assert(found,'sample '+kind);gc.save();gc.beginPath();gc.rect(slot*160,0,160,240);gc.clip();gc.fillStyle='#35414d';gc.fillRect(slot*160,0,160,240);gc.fillStyle='#d4cfba';gc.font='14px monospace';gc.fillText(kind,slot*160+10,28);gc.translate(slot*160+80-found.p.x,135-found.p.y);decals.drawFloorDecals(gc,found.v,found.room);gc.restore();slot++;}
   // View-state transition regressions: first/next burst and cancellation.
   const a={type:'archer',x:0,y:0,hp:10,attackPhase:'warning',attackTime:.1,warningDuration:.7,patternAim:Math.PI,shot:8};actions.gruntActionPose(a,0);a.attackPhase='firing';a.shot=1;assert(actions.gruntActionPose(a,.01).x<0,'first burst recoil');a.shot=2;assert(actions.gruntActionPose(a,.1).x<0,'repeat recoil');a.attackPhase='recover';assert(actions.gruntActionPose(a,.2).face===-1,'recovery face');a.frozen=1;assert(actions.gruntActionPose(a,.21)===null,'cancel frozen');
   // Device lifecycle plus save validation in a genuine planned room.
   let fixture;for(let seed=1;seed<80&&!fixture;seed++){const v=engine.newRun(seed);v.floors.forEach((rooms,f)=>rooms.forEach((room,i)=>{if(!fixture&&room.sealEngine)fixture={v,room,f,i};}));}assert(fixture,'device plan');const {v,room,f,i}=fixture;v.floor=f;v.room=i;sim.enterRoom(v);const d=room.sealEngine;Object.assign(v.player,{x:d.x+d.direction*30,y:d.y});devices.tickSealEngine(v,room,1.2,{x:0,y:0});assert(d.disabled&&room.xpDroppedTotal===18,'disarm reward');assert(storage.parseSave(storage.encodeSave(v)),'device save');engine.enrage(v);assert(d.disabled,'descent reset');assert(storage.parseSave(storage.encodeSave(v)),'return save');
   return {decals:count,kinds:[...kinds],deviceSave:true,actionTransitions:true,rendererStateUnchanged:true};
  });
  for(const reduced of [false,true])for(const kind of ['sanctum','descent','device','effects']){await page.evaluate(([kind,reduced])=>majorRender(kind,reduced),[kind,reduced]);await page.screenshot({path:join(out,`${width}-${kind}-${reduced?'reduced':'normal'}.png`)});}
  await page.evaluate(()=>{document.querySelector('canvas').style.display='none';document.querySelector('#decal-gallery').style.display='block';});await page.screenshot({path:join(out,`${width}-decals.png`)});reports.push({width,height,...result});await cx.close();
 }
 assert.deepEqual(errors,[]);await writeFile(join(out,'result.json'),JSON.stringify({base,reports,errors,physicalDevice:false},null,2));console.log(JSON.stringify({reports,errors}));
}finally{await browser.close();}
