import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom} from '../../src/game/engine.js';
import {challengeDemon,advanceDemonPhase,tryDemonHole,updateDemon} from '../../src/combat/demon.js';
import {stepRun,enterRoom} from '../../src/game/simulation.js';
import {blocked,segmentBlocked} from '../../src/world/terrain.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
import {createPractice,practiceBosses} from '../../src/game/boss-practice.js';

function fight(){const s=newRun(77,{campaign:'expanded'});s.generationVersion=31;s.floor=9;s.room=1;s.player.x=800;s.player.y=410;const r=currentRoom(s);assert.equal(challengeDemon(s),true);return {s,r,d:r.demon,p:s.player};}
test('final boss is hidden, enters with two separate targets and round trips',()=>{
 assert.equal(practiceBosses.some(b=>b.id==='demon'),false);
 assert.equal(currentRoom(createPractice('demon','fire',4)).demon.phase,1);
 const {s,r}=fight();assert.equal(r.demonPending,false);assert.deepEqual(r.enemies.map(e=>e.part),['hand','foot']);assert.equal(parseSave(encodeSave(s)).floors[9][1].demon.phase,1);
 assert.equal(challengeDemon(s),false);
});
test('five fingers produce distinct bounded salvos',()=>{
 const {s,r,d,p}=fight(),counts=[5,3,3,3,7];
 for(let i=0;i<5;i++){const hand=r.enemies[0];d.attack={kind:'hand',owner:'hand',time:.01,x:hand.x,y:hand.y,tx:p.x,ty:p.y,aim:0,finger:i};d.recovery=0;updateDemon(s,r,p,.02,s.projectiles,()=>{});assert.equal(s.projectiles.length,counts.slice(0,i+1).reduce((a,b)=>a+b,0));}
 assert.ok(s.projectiles.some(b=>b.demonCurve));assert.doesNotThrow(()=>parseSave(encodeSave(s)));
});
test('footprint pits persist through all phases, block shots, and keep an open route',()=>{
 const {s,r,p}=fight();p.x=810;p.y=420;
 assert.equal(tryDemonHole(r,360,300,p),true);assert.equal(tryDemonHole(r,480,300,p),true);assert.equal(tryDemonHole(r,600,300,p),true);
 const holes=r.obstacles.filter(o=>o.demonHole);assert.equal(holes.length,3);assert.ok(holes.some(o=>Math.abs(o.x+27-360)<5));
 assert.equal(blocked(480,300,10,r.obstacles),true);assert.equal(segmentBlocked({x:420,y:300},{x:540,y:300},r.obstacles),true);
 r.enemies.forEach(e=>e.hp=0);assert.equal(advanceDemonPhase(r,s.projectiles),true);assert.equal(r.obstacles.filter(o=>o.demonHole).length,3);assert.ok(r.enemies.every(e=>!blocked(e.x,e.y,32,r.obstacles)));
 r.enemies.forEach(e=>e.hp=0);assert.equal(advanceDemonPhase(r,s.projectiles),true);assert.equal(r.obstacles.filter(o=>o.demonHole).length,3);assert.ok(r.enemies.every(e=>!blocked(e.x,e.y,32,r.obstacles)));
 for(const [x,y] of [[720,220],[320,400],[620,400],[750,130]])tryDemonHole(r,x,y,p);
 assert.equal(r.obstacles.filter(o=>o.demonHole).length,4);
 assert.ok(r.obstacles.filter(o=>o.demonHole).some(o=>Math.abs(o.x+27-360)<5));
 assert.doesNotThrow(()=>parseSave(encodeSave(s)));
});
test('part extinction advances two phases before only the final core grants a key',()=>{
 const {s,r,d}=fight();r.enemies.forEach(e=>e.hp=0);assert.equal(advanceDemonPhase(r,s.projectiles),true);assert.equal(d.phase,2);assert.deepEqual(r.enemies.map(e=>e.part),['eye','nose','mouth']);
 r.enemies.forEach(e=>e.hp=0);assert.equal(advanceDemonPhase(r,s.projectiles),true);assert.equal(d.phase,3);assert.deepEqual(r.enemies.map(e=>e.part),['core']);
 const core=r.enemies[0],origin={x:core.x,y:core.y};d.recovery=0;d.attack={kind:'footJump',owner:'core',time:.01,x:core.x,y:core.y,tx:300,ty:320,aim:1};updateDemon(s,r,s.player,.02,s.projectiles,()=>{});assert.deepEqual({x:core.x,y:core.y},origin);
 d.attack={kind:'noseTrail',owner:'core',time:.01,x:core.x,y:core.y,tx:300,ty:320,aim:1};updateDemon(s,r,s.player,.02,s.projectiles,()=>{});assert.deepEqual({x:core.x,y:core.y},origin);
 enterRoom(s);s.entryGrace=0;core.hp=0;const result=stepRun(s,.02);assert.ok(result.events.includes('key'));assert.equal(s.key,true);assert.doesNotThrow(()=>parseSave(encodeSave(s)));
});
test('live simulation does not grant final rewards at phase boundaries',()=>{
 const {s,r}=fight();s.entryGrace=0;r.enemies.forEach(e=>e.hp=0);
 const first=stepRun(s,.02);assert.ok(first.events.includes('demonPhase'));assert.equal(s.key,false);assert.equal(r.used,false);assert.equal(r.demon.phase,2);assert.equal(r.enemies.length,3);
 r.enemies.forEach(e=>e.hp=0);const second=stepRun(s,.02);assert.ok(second.events.includes('demonPhase'));assert.equal(s.key,false);assert.equal(r.used,false);assert.equal(r.demon.phase,3);assert.equal(r.enemies.length,1);
 assert.equal(parseSave(encodeSave(s)).floors[9][1].demon.phase,3);
});
test('eye ray hits once, mouth force moves over time, and pull removes poison combo',()=>{
 const {s,r,d,p}=fight();r.enemies.forEach(e=>e.hp=0);advanceDemonPhase(r,s.projectiles);d.recovery=0;
 const eye=r.enemies.find(e=>e.part==='eye');p.x=500;p.y=eye.y;let hits=0;
 d.attack={kind:'eyeRay',owner:'eye',time:.01,x:eye.x,y:eye.y,tx:p.x,ty:p.y,aim:0};updateDemon(s,r,p,.02,s.projectiles,()=>hits++);assert.equal(hits,1);
 const mouth=r.enemies.find(e=>e.part==='mouth');p.x=mouth.x+110;p.y=mouth.y;d.recovery=0;d.trails=[{x:p.x,y:p.y,radius:34,time:4}];
 d.attack={kind:'mouthPull',owner:'mouth',time:.01,x:mouth.x,y:mouth.y,tx:p.x,ty:p.y,aim:0};updateDemon(s,r,p,.02,s.projectiles,()=>{});assert.equal(d.trails.length,0);assert.equal(d.force.kind,'mouthPull');
 const before=p.x;updateDemon(s,r,p,.3,s.projectiles,()=>{});assert.ok(p.x<before);assert.doesNotThrow(()=>parseSave(encodeSave(s)));
});
test('final shadow attacks do not repeat immediately and keep the core fixed',()=>{
 const {s,r,d,p}=fight();r.enemies.forEach(e=>e.hp=0);advanceDemonPhase(r,s.projectiles);r.enemies.forEach(e=>e.hp=0);advanceDemonPhase(r,s.projectiles);
 d.recovery=0;const origin={x:r.enemies[0].x,y:r.enemies[0].y};let last=null;
 for(let i=0;i<12;i++){d.attack=null;d.attackClock=0;updateDemon(s,r,p,.01,s.projectiles,()=>{});assert.ok(d.attack&&d.attack.kind!==last);last=d.attack.kind;}
 assert.deepEqual({x:r.enemies[0].x,y:r.enemies[0].y},origin);assert.doesNotThrow(()=>parseSave(encodeSave(s)));
});
test('foot pressure adds a jump and final core fires a readable seven-shot spread',()=>{
 const {s,r,d,p}=fight();d.attackClock=0;d.footPressureClock=0;d.recovery=0;
 updateDemon(s,r,p,.01,s.projectiles,()=>{});assert.equal(d.attack.kind,'footJump');
 r.enemies.forEach(e=>e.hp=0);advanceDemonPhase(r,s.projectiles);r.enemies.forEach(e=>e.hp=0);advanceDemonPhase(r,s.projectiles);
 const core=r.enemies[0];d.recovery=0;d.attack={kind:'coreBurst',owner:'core',time:.01,x:core.x,y:core.y,tx:p.x,ty:p.y,aim:0};
 updateDemon(s,r,p,.02,s.projectiles,()=>{});assert.equal(s.projectiles.filter(b=>b.enemy&&b.life>0).length,7);
 assert.doesNotThrow(()=>parseSave(encodeSave(s)));
});
test('active parts reposition and accelerated projectiles retain a warning interval',()=>{
 const {s,r,d,p}=fight();d.attackClock=3;d.recovery=0;p.x=510;p.y=430;
 const before=r.enemies.map(e=>({x:e.x,y:e.y}));updateDemon(s,r,p,1,s.projectiles,()=>{});
 assert.ok(r.enemies.every((e,i)=>Math.hypot(e.x-before[i].x,e.y-before[i].y)>20));
 d.attack={kind:'hand',owner:'hand',time:.85,x:r.enemies[0].x,y:r.enemies[0].y,tx:p.x,ty:p.y,aim:0,finger:1};
 updateDemon(s,r,p,.4,s.projectiles,()=>{});assert.equal(s.projectiles.length,0);
 updateDemon(s,r,p,.45,s.projectiles,()=>{});assert.equal(s.projectiles.length,3);
 assert.ok(s.projectiles.every(b=>Math.hypot(b.vx,b.vy)>300));
 r.enemies.forEach(e=>e.hp=0);advanceDemonPhase(r,s.projectiles);d.recovery=0;d.attackClock=3;
 const eye=r.enemies.find(e=>e.part==='eye'),nose=r.enemies.find(e=>e.part==='nose'),oldEye={x:eye.x,y:eye.y},oldNose={x:nose.x,y:nose.y};
 updateDemon(s,r,p,1,s.projectiles,()=>{});
 assert.ok(Math.hypot(eye.x-oldEye.x,eye.y-oldEye.y)>20);
 assert.ok(Math.hypot(nose.x-oldNose.x,nose.y-oldNose.y)>40);
 assert.doesNotThrow(()=>parseSave(encodeSave(s)));
});
test('a minute of live combat stays bounded and re-entry clears only the old warning',()=>{
 const {s,r,d,p}=fight();p.max=p.hp=100;s.entryGrace=0;s.attack=100;
 for(let i=0;i<1200;i++)stepRun(s,.05);
 assert.ok(d.turn>=8);assert.ok(s.projectiles.length<2000);assert.ok(r.obstacles.filter(o=>o.demonHole).length<=4);
 assert.doesNotThrow(()=>parseSave(encodeSave(s)));
 d.attack={kind:'footJump',owner:'foot',time:.5,x:675,y:255,tx:400,ty:300,aim:1};enterRoom(s);assert.equal(d.attack,null);assert.ok(r.obstacles.filter(o=>o.demonHole).length<=4);
});
