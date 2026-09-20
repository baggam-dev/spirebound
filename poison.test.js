import test from 'node:test';
import assert from 'node:assert/strict';
import {updatePoisonEnemy,updateHazards} from './poison.js';
import {newRun,currentRoom,enrage} from './engine.js';
import {stepRun} from './simulation.js';
import {encodeSave,parseSave} from './storage.js';
import {attackProfile} from './balance.js';

test('flower remains fixed, warns, flies and waits until its two-second puddle expires',()=>{
 const e={id:0,type:'flower',x:200,y:200,cd:0},p={x:500,y:300},r={enemies:[e],obstacles:[]};
 updatePoisonEnemy(e,p,r,.01);assert.equal(r.hazards.length,1);assert.equal(r.hazards[0].phase,'warning');
 p.x=700;let active=0,damage=0,previousPhase='warning';
 for(let i=0;i<370;i++){
  updateHazards(r,.01,p,()=>damage++);
  if(r.hazards[0]?.phase==='active')active+=.01;
  if(r.hazards[0])assert.equal(r.hazards[0].x,500);
  assert.equal(r.hazards.length<=1,true);assert.equal(e.x,200);assert.equal(e.y,200);
  previousPhase=r.hazards[0]?.phase;updatePoisonEnemy(e,p,r,.01);
  if(!previousPhase)break;
 }
 assert.ok(Math.abs(active-2)<.02);assert.equal(damage,0);assert.equal(r.hazards[0].phase,'warning');assert.equal(r.hazards[0].x,700);
});
test('frenzy flower emits two or three puddles, never refires over its existing zones',()=>{
 for(const depth of [1,4]){const e={id:0,type:'flower',x:200,y:200,cd:0,escapeDepth:depth},r={enemies:[e]},p={x:500,y:300};updatePoisonEnemy(e,p,r,.01);assert.equal(r.hazards.length,depth===1?2:3);for(let i=0;i<500;i++)updatePoisonEnemy(e,p,r,.01);assert.equal(r.hazards.length,depth===1?2:3);}
});
test('overlapping poison pulses once per second, while dead-owner aura disappears',()=>{
 const h={owner:0,kind:'puddle',x:400,y:200,r:40,phase:'active',time:3,damage:9},r={enemies:[],hazards:[{...h},{...h},{...h,kind:'aura'}]};let hits=0;
 for(let i=0;i<200;i++)updateHazards(r,.01,{x:400,y:200},()=>hits++);
 assert.equal(hits,2);assert.equal(r.hazards.length,2);
});
test('slime splits 1 to 2 to 4, unique ids survive reload, last fragment opens seventh floor',()=>{
 let s=newRun(42);s.floor=5;s.room=s.floors[5].findIndex(r=>r.type==='boss');s.player.x=100;s.player.y=450;s.attack=999;
 currentRoom(s).enemies[0].hp=0;let result=stepRun(s,.01);assert.equal(s.key,false);assert.equal(currentRoom(s).enemies.length,2);assert.ok(!result.events.includes('key'));
 s=parseSave(encodeSave(s));const r=currentRoom(s),ids=new Set(r.enemies.map(e=>e.id));
 r.enemies.forEach(e=>e.hp=0);stepRun(s,.01);assert.equal(r.enemies.length,4);assert.equal(s.key,false);for(const e of r.enemies){assert.ok(!ids.has(e.id));ids.add(e.id);assert.equal(e.stage,2);}
 for(let i=0;i<3;i++){r.enemies[0].hp=0;stepRun(s,.01);assert.equal(s.key,false);}
 r.enemies.push({id:999,type:'minislime',summoned:true,hp:5,max:5,x:500,y:300,cd:1});r.enemies[0].hp=0;result=stepRun(s,.01);assert.equal(result.events.filter(e=>e==='stairs').length,1);assert.equal(s.key,false);assert.equal(r.enemies.length,0);assert.equal(r.used,true);
 assert.equal(stepRun(s,.01).events.includes('key'),false);
});
test('only first two slime generations summon and summons give no XP, seal or drops',()=>{
 for(const stage of [0,1,2]){const e={id:0,type:'boss',variant:'slime',stage,poisonTurn:2,x:400,y:200,hp:900,max:900,cd:0},r={enemies:[e],hazards:[]};updatePoisonEnemy(e,{x:700,y:300},r,.01);assert.equal(r.enemies.length,stage<2?3:1);if(stage<2)assert.equal(r.enemies[1].max,90);}
 const s=newRun(5),r=currentRoom(s);s.player.unique=true;s.player.leechKills=11;s.player.hp=3;s.attack=99;r.enemies=[{id:0,type:'minislime',summoned:true,x:500,y:300,hp:0,max:10,cd:1}];stepRun(s,.01);assert.equal(s.kills,0);assert.equal(s.player.xp,0);assert.equal(s.player.hp,3);assert.equal(s.player.leechKills,11);
});
test('poison phases and summons resume deterministically with validated saves',()=>{
 let s=newRun(14);s.floor=5;s.room=s.floors[5].findIndex(r=>r.type==='boss');s.player.x=100;s.player.y=450;s.attack=999;s.invulnerable=999;currentRoom(s).seen=true;
 for(let i=0;i<270;i++)stepRun(s,.02);assert.ok(currentRoom(s).hazards.length);
 const copy=parseSave(encodeSave(s));for(let i=0;i<400;i++){stepRun(s,.02);stepRun(copy,.02);}assert.deepEqual(JSON.parse(JSON.stringify(s)),copy);
 const bad=structuredClone(s);currentRoom(bad).hazards=[{kind:'puddle',phase:'active',time:2,r:Infinity}];assert.throws(()=>encodeSave(bad));
});
test('descending escape increases crowd size and attack pressure while preserving map',()=>{
 for(let seed=1;seed<=30;seed++){const s=newRun(seed);enrage(s);let previous=0;for(let f=5;f>=0;f--){const enemies=s.floors[f][0].enemies;assert.ok(enemies.length>=previous);previous=enemies.length;assert.ok(enemies.every(e=>e.escapeDepth===8-f));}
  const top=attackProfile(s.floors[5][0].enemies[0]),bottom=attackProfile(s.floors[0][0].enemies[0]);assert.ok(bottom.speed>top.speed&&bottom.count>top.count&&bottom.recovery<top.recovery);
 }
});

test('flower targets walls and corners in ascent and descent, with warning and escape time',()=>{
 for(const escapeDepth of [0,1,3])for(const [x,y] of [[31,270],[929,270],[480,49],[480,491],[31,49],[929,49],[31,491],[929,491]]){
  const e={id:0,type:'flower',x:480,y:270,cd:0,escapeDepth},p={x,y};
  const r={enemies:[e],obstacles:[{x:x+15,y:y-10,w:20,h:20}]};
  updatePoisonEnemy(e,p,r,.01);assert.equal(r.hazards[0].x,x);assert.equal(r.hazards[0].y,y);assert.equal(r.hazards.length,escapeDepth>=3?3:escapeDepth?2:1);
  let hits=0;updateHazards(r,.5,p,()=>hits++);assert.equal(hits,0);
  updateHazards(r,.51,p,()=>hits++);assert.equal(hits,0);updateHazards(r,.66,p,()=>hits++);assert.equal(hits,1);
  r.poisonPulse=0;updateHazards(r,.01,{x:480,y:270},()=>hits++);assert.equal(hits,1);
 }
});
