import test from 'node:test';
import assert from 'node:assert/strict';
import {highFloorKinds} from '../../src/combat/high-floor-profile.js';
import {updateHighFloorEnemy,tickHighState,highStepEnd} from '../../src/combat/high-floor-patterns.js';
import {validateHighFloorEnemy} from '../../src/persistence/high-floor-save.js';
import {enemyDamageFactor} from '../../src/combat/enemy-defense.js';
import {warningCount,coordinateAttack} from '../../src/combat/tactics.js';
import {drawHighFloorGround} from '../../src/rendering/high-floor-vfx.js';
import {assetPlanFiles,floorAssetPlan} from '../../src/rendering/asset-packs.js';
import {newRun,currentRoom} from '../../src/game/engine.js';
import {stepRun} from '../../src/game/simulation.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
const actor=(type,x=300,y=270)=>({id:0,type,x,y,hp:100,max:100,cd:0,balanceVersion:1});
function scene(type,p={x:390,y:270,lastMove:{x:1,y:0}}){const e=actor(type),room={enemies:[e],obstacles:[]},bullets=[],hits=[];return {e,p,room,bullets,hits,tick(dt=.01){return updateHighFloorEnemy(e,p,room,dt,bullets,n=>hits.push(n));}};}
function finish(s){let count=0;while(s.e.highAttack&&count++<1000)s.tick();assert.ok(count<1000);}
const number=(n,min,max)=>Number.isFinite(n)&&n>=min&&n<=max,check=ok=>assert.ok(ok);
test('all nine generic kinds start their own controller, while bosses and named gates keep legacy behavior',()=>{
 for(const type of Object.keys(highFloorKinds)){const s=scene(type);assert.equal(s.tick(),true);assert.ok(s.e.highAttack);const named=scene(type);named.e.gateTitle='기존 수문장';assert.equal(named.tick(),false);assert.equal(named.e.highAttack,undefined);}
});
test('halberd is a fixed narrow thrust rather than the old shared sector and is blocked by cover',()=>{
 const front=scene('royalGuard',{x:420,y:270});front.tick();front.tick(.3);assert.deepEqual(front.hits,[9]);front.tick(.12);assert.deepEqual(front.hits,[9]);
 const side=scene('royalGuard',{x:420,y:270});side.tick();side.p.y=310;side.tick(.3);assert.deepEqual(side.hits,[]);
 const wall=scene('royalGuard',{x:420,y:270});wall.tick();wall.room.obstacles=[{x:350,y:240,w:30,h:60}];wall.tick(.3);assert.deepEqual(wall.hits,[]);
});
test('shield advances within its budget, keeps old frontal reduction and lowers the guard in recovery',()=>{
 const s=scene('starKnight');s.tick();s.tick(.3);assert.ok(s.e.x-300<=24);assert.equal(enemyDamageFactor(s.e,{x:500,y:270}),.65);assert.equal(enemyDamageFactor(s.e,{x:100,y:270}),1);s.tick(.3);s.tick(.12);assert.equal(s.e.highAttack.stage,'recover');assert.equal(enemyDamageFactor(s.e,{x:500,y:270}),1);
});
test('sniper locks both marks, fires exactly twice and preserves the saved second aim',()=>{
 const s=scene('astralSniper',{x:580,y:270,lastMove:{x:0,y:1}});s.tick();const mark={x:s.e.highAttack.secondX,y:s.e.highAttack.secondY};s.e.highAttack=JSON.parse(JSON.stringify(s.e.highAttack));s.p.x=700;s.p.y=380;s.tick(.65);assert.equal(s.bullets.length,1);s.tick(.3);assert.equal(s.bullets.length,2);assert.ok(Math.abs(Math.atan2(s.bullets[1].vy,s.bullets[1].vx)-Math.atan2(mark.y-s.e.y,mark.x-s.e.x))<1e-9);finish(s);assert.equal(s.bullets.length,2);
});
test('turret uses only two fixed four-way volleys, with a separate second warning',()=>{
 const s=scene('pulseTurret');s.tick();s.tick(.7);assert.equal(s.bullets.length,4);assert.equal(s.e.highAttack.stage,'windup2');s.tick(.64);assert.equal(s.bullets.length,4);s.tick(.01);assert.equal(s.bullets.length,8);finish(s);assert.equal(s.bullets.length,8);
});
test('gravity has no warning pull, a finite active window and cancels on freeze',()=>{
 const s=scene('gravityMage');s.tick();s.p.x=400;const x=s.p.x;s.tick(.64);assert.equal(s.p.x,x);s.tick(.01);s.tick(.4);assert.ok(s.p.x<x);s.tick(.4);assert.equal(s.e.highAttack.stage,'recover');const after=s.p.x;s.tick(.5);assert.equal(s.p.x,after);s.e.frozen=1;tickHighState(s.e,.01);assert.equal(s.e.highAttack,undefined);assert.equal(s.hits.length,0);
});
test('resonance is a single cooldown pulse with a floor and does not affect a named/boss ally',()=>{
 const s=scene('starBearer'),ally={...actor('chaser',320),id:1,cd:.6},boss={...actor('boss',320),id:2,cd:.2};s.room.enemies.push(ally,boss);s.tick();s.tick(.6);assert.equal(ally.cd,.45);assert.equal(boss.cd,.2);ally.cd=1;s.tick(.1);assert.equal(ally.cd,1);assert.equal(s.bullets.length,0);
});
test('rift marks a side landing, slashes once and returns without an arrival/return damage event',()=>{
 const s=scene('riftHunter',{x:500,y:270});s.tick();const a={...s.e.highAttack};assert.ok(Math.hypot(a.tx-s.p.x,a.ty-s.p.y)>=70);s.tick(.45);assert.equal(s.hits.length,0);s.tick(.25);assert.equal(s.hits.length,1);s.tick(.12);s.tick(.35);assert.equal(s.e.x,a.homeX);assert.equal(s.e.y,a.homeY);assert.equal(s.hits.length,1);
});
test('soldier steps no more than 24px and hits only once at the end of the strike',()=>{
 const s=scene('demonSoldier',{x:370,y:270});s.tick();s.tick(.25);assert.equal(s.hits.length,0);s.tick(.12);assert.ok(s.e.x-300<=24);assert.deepEqual(s.hits,[9]);finish(s);assert.deepEqual(s.hits,[9]);assert.ok(highStepEnd(actor('demonSoldier'),0,24,[{x:325,y:250,w:20,h:40}]).x<=306);
});
test('captain gets one dash and one separately warned axe finish; close range skips the dash',()=>{
 const s=scene('demonCaptain',{x:480,y:270});s.tick();s.tick(.75);assert.equal(s.e.highAttack.stage,'dash');s.tick(.42);assert.equal(s.e.highAttack.stage,'windup2');assert.equal(s.e.highAttack.duration,.4);finish(s);assert.equal(s.e.highAttack,undefined);
 const close=scene('demonCaptain',{x:350,y:270});close.tick();assert.equal(close.e.highAttack.close,true);close.tick(.3);assert.equal(close.e.highAttack.stage,'strike');
});
test('every produced stage is serializable and pending combos retain the shared warning reservation',()=>{
 for(const type of Object.keys(highFloorKinds)){const s=scene(type);s.tick();for(let i=0;i<300&&s.e.highAttack;i++){const copy=JSON.parse(JSON.stringify(s.e));validateHighFloorEnemy(copy,check,number);assert.equal(coordinateAttack(copy,{enemies:[copy]}),true);if(copy.highAttack.stage!=='recover')assert.equal(warningCount({enemies:[copy]},null),1);s.tick();}}
 const s=scene('royalGuard');s.tick();s.e.highAttack.kind='cross';assert.throws(()=>validateHighFloorEnemy(s.e,check,number));
});
test('renderer leaves actors and combat data unchanged and high-floor art is not in the first-floor pack',()=>{
 const c=new Proxy({},{get:(t,k)=>k in t?t[k]:(()=>{}),set:(t,k,v)=>(t[k]=v,true)});
 for(const type of Object.keys(highFloorKinds)){const s=scene(type);s.tick();const before=JSON.stringify(s);drawHighFloorGround(c,s.e,s.room,{reduced:true});assert.equal(JSON.stringify(s),before);}
 assert.ok(assetPlanFiles(floorAssetPlan(6)).includes('high-hall-atlas-v2.png'));assert.equal(assetPlanFiles(floorAssetPlan(0)).includes('high-hall-atlas-v2.png'),false);
});
test('real simulation saves a resolved thrust and resume never applies that hit a second time',()=>{
 const s=newRun(810,{campaign:'expanded'}),r=currentRoom(s);s.attack=999;s.entryGrace=0;Object.assign(s.player,{x:420,y:270});r.obstacles=[];r.enemies=[actor('royalGuard')];stepRun(s,.01);assert.equal(r.enemies[0].highAttack.kind,'thrust');stepRun(s,.3);const hp=s.player.hp,loaded=parseSave(encodeSave(s));assert.equal(currentRoom(loaded).enemies[0].highAttack.stage,'strike');stepRun(loaded,.05);stepRun(loaded,.12);assert.equal(loaded.player.hp,hp);
});
