import test from 'node:test';
import assert from 'node:assert/strict';
import {strengthenGateKnight} from '../../src/combat/balance.js';
import {startUpperAttack,updateUpper} from '../../src/combat/upper-floors.js';
import {newRun} from '../../src/game/engine.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
import {stepRun} from '../../src/game/simulation.js';
import {gateBossXpReward} from '../../src/progression/enemy-rewards.js';
import {dropXp} from '../../src/progression/xp-drops.js';

test('Kald chains a successful dash into separately warned slashes but cover keeps its counter window',()=>{
 for(const blocked of [false,true]){
  const e={id:0,type:'starKnight',gateTitle:'Cald',hp:100,max:100,x:300,y:270},p={x:600,y:270},r={enemies:[e],obstacles:blocked?[{x:420,y:200,w:30,h:140}]:[]};
  startUpperAttack(e,'dash',p,r);updateUpper(e,p,r,e.darkAttack.time,[],()=>{});updateUpper(e,p,r,.32,[],()=>{});
  if(blocked){assert.equal(e.darkAttack,undefined);assert.equal(e.opening,1.8);assert.equal(e.counterReason,'cover');}
  else{assert.equal(e.darkAttack.kind,'slash');assert.equal(e.darkAttack.step,0);assert.equal(e.darkAttack.time,.45);}
 }
});

test('the gate pair drops one boss XP reward only after both die and never repeats after reload',()=>{
 for(const legacy of [0,36]){
 let s=newRun(42);s.floor=6;s.room=s.floors[6].findIndex(r=>r.gate);let r=s.floors[6][s.room];r.obstacles=[];s.attack=999;s.invulnerable=999;s.entryGrace=0;
 if(legacy)dropXp(s,r,r.enemies[0],legacy,'elite');
 r.enemies[0].hp=0;r.enemies[1].cd=999;let result=stepRun(s,.01);assert.ok(!result.events.includes('gateReward'));assert.equal(r.xpDroppedTotal||0,legacy);
 r.enemies[0].hp=0;result=stepRun(s,.01);assert.ok(result.events.includes('gateReward'));assert.ok(result.events.includes('xpBoss'));assert.equal(r.xpDroppedTotal,gateBossXpReward(6));assert.equal(r.xpDroppedTotal,360);
 s=parseSave(encodeSave(s));r=s.floors[6][s.room];result=stepRun(s,.01);assert.ok(!result.events.includes('gateReward'));assert.equal(r.xpDroppedTotal,360);
 }
});
test('gate knight health upgrade preserves health ratio and cannot stack across reloads',()=>{
 const e={type:'starKnight',gateTitle:'Cald',hp:500,max:1000};strengthenGateKnight(e);assert.equal(e.max,1540);assert.equal(e.hp,770);strengthenGateKnight(e);assert.equal(e.max,1540);
 const s=newRun(42),knight=s.floors[6].find(r=>r.gate).enemies.find(e=>e.type==='starKnight');assert.equal(knight.gateKnightBuff,1);const max=knight.max;const loaded=parseSave(encodeSave(s));assert.equal(loaded.floors[6].find(r=>r.gate).enemies.find(e=>e.type==='starKnight').max,max);
 e.hp=0;delete e.gateKnightBuff;strengthenGateKnight(e);assert.equal(e.hp,0);
});
test('gate knight walks at the upgraded speed and has shorter post-attack cooldown',()=>{
 const e={id:0,type:'starKnight',gateTitle:'Cald',hp:100,max:100,x:300,y:270,cd:2},p={x:600,y:270},r={enemies:[e],obstacles:[]};updateUpper(e,p,r,.1,[],()=>{});assert.ok(Math.abs(e.x-312)<1e-9);
 startUpperAttack(e,'slash',p,r);updateUpper(e,p,r,.3,[],()=>{});assert.equal(e.darkAttack.time,.2);updateUpper(e,p,r,.2,[],()=>{});assert.equal(e.cd,.35);
});

test('both named guards gain forty percent from the current health without reviving or repeated upgrades',()=>{
 for(const type of ['starKnight','astralSniper'])for(const hp of [0,400,1000]){
  const e={type,gateTitle:'guard',hp,max:1000,gateKnightBuff:1};strengthenGateKnight(e);assert.equal(e.max,1400);assert.equal(e.hp,hp===0?0:hp===400?560:1400);assert.equal(e.gateDurabilityVersion,1);
  const copy=JSON.parse(JSON.stringify(e));strengthenGateKnight(copy);assert.deepEqual(copy,e);
 }
 const normal={type:'starKnight',hp:100,max:100};strengthenGateKnight(normal);assert.deepEqual(normal,{type:'starKnight',hp:100,max:100});
});

test('old named saves upgrade once and invalid upgrade markers are rejected',()=>{
 const s=newRun(42),r=s.floors[6].find(r=>r.gate),expected=[];
 for(const e of r.enemies){e.max=1000;e.hp=500;delete e.gateDurabilityVersion;expected.push(e.type);}
 const loaded=parseSave(encodeSave(s)),guards=loaded.floors[6].find(r=>r.gate).enemies;
 assert.equal(expected.length,2);for(const e of guards){assert.equal(e.max,1400);assert.equal(e.hp,700);assert.equal(e.gateDurabilityVersion,1);}
 const again=parseSave(encodeSave(loaded));assert.deepEqual(again.floors[6].find(r=>r.gate).enemies.map(e=>[e.max,e.hp]),[[1400,700],[1400,700]]);
 guards[0].gateDurabilityVersion=2;assert.throws(()=>encodeSave(loaded));
});

test('Kald keeps the readable first warning and shortens the second slash to point two seconds',()=>{
 const e={id:0,type:'starKnight',gateTitle:'Cald',hp:100,max:100,x:300,y:270},p={x:400,y:270},r={enemies:[e],obstacles:[]};let hits=0;
 startUpperAttack(e,'slash',p,r);assert.equal(e.darkAttack.time,.3);updateUpper(e,p,r,.3,[],()=>hits++);assert.equal(hits,1);assert.equal(e.darkAttack.time,.2);
 updateUpper(e,p,r,.19,[],()=>hits++);assert.equal(hits,1);updateUpper(e,p,r,.01,[],()=>hits++);assert.equal(hits,2);assert.equal(e.darkAttack,undefined);
});
