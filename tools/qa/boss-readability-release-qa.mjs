// Isolated saved fixtures through production loading/RAF/UI; never submits scores.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(join(process.env.PLAYWRIGHT_PATH,'index.mjs')).href);
const base=process.env.BASE_URL||'http://localhost:5173',out=process.argv[2],publicCore=process.argv.includes('--public-core');await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],results=[];let scores=0,active;
try{
 for(const [width,height,reduced] of (publicCore?[[844,390,false],[844,390,true]]:[[1280,800,false],[844,390,false],[844,390,true]])){
  const cx=await browser.newContext({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000}),p=await cx.newPage();active=p;p.setDefaultTimeout(360000);p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(r.method()==='POST'&&r.url().endsWith('/api/records'))scores++;});
  await cx.addInitScript(reduced=>localStorage.setItem('spirebound.settings.v1',JSON.stringify({muted:true,volume:0,reducedEffects:reduced})),reduced);
  const scenes=publicCore?(reduced?['demon-core']:['king-judgment','velkar-rain','demon-mouth']):['king-judgment','king-transition','velkar-rain','velkar-transition','demon-mouth','demon-core'];
  for(const scene of scenes){
   console.log(width,reduced,scene);await p.goto(base,{waitUntil:'domcontentloaded'});
   await p.evaluate(async({scene,reduced})=>{
    const {newRun,currentRoom}=await import('/src/game/engine.js'),{RunStore}=await import('/src/persistence/storage.js'),{challengeKing,startUpperAttack}=await import('/src/combat/upper-floors.js'),{challengeCommander}=await import('/src/combat/commander.js'),{challengeDemon,advanceDemonPhase}=await import('/src/combat/demon.js');
    const s=newRun(871,{campaign:'expanded'});s.floor=scene.startsWith('king')?7:scene.startsWith('velkar')?8:9;s.room=s.floors[s.floor].findIndex(r=>r.type==='boss');const r=currentRoom(s);r.enemies=[];
    if(scene.startsWith('king'))challengeKing(s);else if(scene.startsWith('velkar'))challengeCommander(s);else{challengeDemon(s);const target=scene==='demon-core'?3:2;while(r.demon.phase<target){r.enemies.forEach(e=>e.hp=0);advanceDemonPhase(r,[]);}}
    s.tutorialComplete=true;s.attack=999;s.invulnerable=0;s.entryGrace=1;Object.assign(s.player,{x:780,y:420,hp:10,max:10});r.seen=true;
    if(scene.startsWith('king')){const e=r.enemies[0];e.hp=e.max*(scene==='king-transition'?.5:.25);e.kingStage=scene==='king-transition'?2:3;if(scene==='king-transition')e.kingTransition=1.2;else{startUpperAttack(e,'judgment',s.player,r);e.darkAttack.axis=reduced?'horizontal':'vertical';e.darkAttack.step=1;} }
    if(scene.startsWith('velkar')){const e=r.enemies[0],c=e.commander;e.hp=e.max*.4;c.phase=2;if(scene==='velkar-transition')c.transition=1;else c.rain={x:480,y:320,radius:120,time:.9};}
    if(scene.startsWith('demon')){const d=r.demon;d.recovery=0;d.partClocks=Object.fromEntries(r.enemies.map(e=>[e.part,3]));
     if(scene==='demon-mouth'){const mouth=r.enemies.find(e=>e.part==='mouth'),eye=r.enemies.find(e=>e.part==='eye');d.force={kind:'mouthPull',x:mouth.x,y:mouth.y,time:.65};d.attacks=[{kind:'eyeRay',owner:'eye',x:eye.x,y:eye.y,tx:600,ty:400,aim:1,time:.6}];d.trails=[{x:620,y:270,radius:34,time:2},{x:650,y:280,radius:34,time:2}];}
     else{const core=r.enemies[0];d.attacks=[{kind:reduced?'coreSweepRight':'coreSweepLeft',owner:'core',x:core.x,y:core.y,tx:480,ty:350,aim:Math.PI/2,time:.8,windup:.9}];d.special={kind:'flame',x:640,y:340,radius:60,time:2.5};d.fields=[{x:550,y:320,radius:86,time:2.5}];}
    }
    r.fireZones=[{x:380,y:320,r:90,time:2,dps:0}];const saved=new RunStore(localStorage).write(s);if(!saved.ok)throw Error(saved.error);
   },{scene,reduced});
   await p.reload({waitUntil:'domcontentloaded'});await p.locator('#continue').click();await p.waitForFunction(()=>!document.querySelector('#overlay').children.length);await p.waitForTimeout(100);await p.keyboard.press('Escape');await p.locator('#resume').waitFor();assert.doesNotMatch(await p.locator('#saveStatus').innerText(),/실패/);
   const snapshot=await p.evaluate(async()=>{const {RunStore}=await import('/src/persistence/storage.js'),s=new RunStore(localStorage).read().run,r=s.floors[s.floor][s.room];return {floor:s.floor+1,hp:s.player.hp,enemies:r.enemies.length,variant:r.enemies[0].variant,phase:r.demon?.phase??r.enemies[0].kingStage??r.enemies[0].commander?.phase};});assert.ok(snapshot.enemies>0);assert.equal(snapshot.hp,10);
   await p.locator('#overlay').evaluate(e=>e.style.visibility='hidden');await p.screenshot({path:join(out,`${scene}-${width}-${reduced?'reduced':'normal'}.png`)});await p.locator('#overlay').evaluate(e=>e.style.visibility='');
   await p.reload({waitUntil:'domcontentloaded'});await p.locator('#continue').click();await p.waitForFunction(()=>!document.querySelector('#overlay').children.length);const timing=await p.evaluate(()=>new Promise(resolve=>{const a=[];let last=performance.now();function frame(now){a.push(now-last);last=now;if(a.length<60)requestAnimationFrame(frame);else{a.sort((x,y)=>x-y);resolve({mean:a.reduce((x,y)=>x+y,0)/a.length,p95:a[56]});}}requestAnimationFrame(frame);}));await p.keyboard.press('Escape');await p.locator('#resume').waitFor();assert.doesNotMatch(await p.locator('#saveStatus').innerText(),/실패/);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);results.push({width,reduced,scene,...snapshot,resume:true,timing});
  }await cx.close();
 }
 assert.deepEqual(errors,[]);assert.equal(scores,0);await writeFile(join(out,'result.json'),JSON.stringify({base,results,errors,scoreSubmissions:scores},null,2));console.log(JSON.stringify({scenes:results.length,errors,scoreSubmissions:scores}));
}catch(error){if(active&&!active.isClosed()){await active.screenshot({path:join(out,'failure.png')});await writeFile(join(out,'failure.json'),JSON.stringify({message:error.message,overlay:await active.locator('#overlay').innerText(),errors,results},null,2));}throw error;}finally{await browser.close();}
