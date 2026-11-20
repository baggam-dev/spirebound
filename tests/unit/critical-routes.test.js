import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom} from '../../src/game/engine.js';
import {stepRun} from '../../src/game/simulation.js';
import {hitEnemy} from '../../src/progression/progression.js';
import {tickElements} from '../../src/combat/elements.js';
import {castUltimate,tickRain} from '../../src/combat/abilities.js';
import {tickPassives,passiveHit} from '../../src/progression/passives.js';
import {weaponSnapshot} from '../../src/combat/weapon-projectiles.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
import {bindCriticalRun,drainDamageResults} from '../../src/combat/critical.js';
function fixture(){const s=newRun(42),r=currentRoom(s);s.player.critChance=.5;s.critical.randomState=0;s.attack=999;s.entryGrace=0;s.invulnerable=999;r.obstacles=[];r.enemies=[{id:0,type:'chaser',x:530,y:300,hp:10000,max:10000,cd:99,frozen:4,balanceVersion:1}];return {s,r,e:r.enemies[0]};}
test('actual frost projectile shares one critical decision between physical and elemental damage',()=>{
 const {s,e}=fixture();s.player.frost=1;s.projectiles=[{x:490,y:300,vx:420,vy:0,life:3,enemy:false,pierce:0,hit:[],element:'frost',elemental:true,primary:true}];const random=s.randomState;
 const result=stepRun(s,.1);assert.ok(Math.abs(10000-e.hp-28.05)<1e-8);assert.equal(s.critical.sequence,1);assert.equal(s.critical.hits,1);assert.equal(s.critical.criticalHits,1);assert.equal(s.randomState,random);
 assert.equal(result.damageResults.length,2);assert.ok(result.damageResults.every(f=>f.critical));assert.equal(result.damageResults[1].newHit,false);assert.equal(result.damageResults[0].attackId,result.damageResults[1].attackId);
});
test('a projectile miss consumes no critical random values',()=>{
 const {s,e}=fixture();e.x=800;s.projectiles=[{x:100,y:300,vx:420,vy:0,life:3,enemy:false,pierce:0,hit:[],elemental:true}];const before=s.critical.randomState;
 const result=stepRun(s,.01);assert.equal(s.critical.randomState,before);assert.equal(s.critical.hits,0);assert.deepEqual(result.damageResults,[]);
});
test('poison application keeps one decision across tick sizes and reload',()=>{
 const {s,r,e}=fixture();s.player.poison=1;hitEnemy(s.player,e,r.enemies,[],1,true,r,s.player,{primary:true});const after=e.hp,random=s.critical.randomState;
 tickElements(r,.2,1);tickElements(r,.2,1);assert.ok(Math.abs(after-e.hp-2.88)<1e-8);assert.equal(s.critical.randomState,random);assert.equal(s.critical.criticalHits,1);
 const restored=parseSave(encodeSave(s)),loaded=currentRoom(restored).enemies[0];const before=loaded.hp;stepRun(restored,.2);assert.ok(Math.abs(before-loaded.hp-1.44)<1e-8);assert.equal(restored.critical.randomState,random);assert.equal(restored.critical.criticalHits,1);
});
test('mixed critical and ordinary burn accrual survives saving before its half-second pulse',()=>{
 let {s,r,e}=fixture();s.player.fire=2;hitEnemy(s.player,e,r.enemies,[],1,true,r,s.player,{primary:true});s.player.critChance=0;hitEnemy(s.player,e,r.enemies,[],1,true,r,s.player,{primary:true});
 const before=e.hp;tickElements(r,.25);assert.equal(e.hp,before);assert.equal(e.burnComponents.length,2);const random=s.critical.randomState;
 s=parseSave(encodeSave(s));r=currentRoom(s);e=r.enemies[0];stepRun(s,.25);assert.ok(Math.abs(before-e.hp-7.5)<1e-8);assert.equal(s.critical.randomState,random);
});
test('rain makes one target decision per real pulse without changing its six-pulse damage snapshot',()=>{
 const {s,r,e}=fixture();s.player.ultimate=1;s.player.evolutions={ultimate:'burst'};const random=s.randomState;assert.equal(castUltimate(s),true);assert.equal(r.arrowRain.damage,85);assert.equal(10000-e.hp,127.5);
 for(let i=0;i<5;i++)tickRain(s,.3);assert.equal(s.critical.hits,6);assert.equal(s.critical.sequence,6);assert.equal(s.randomState,random);assert.equal(r.arrowRain.pulses,6);
});
test('crossbow projectiles keep installed critical stats after player stats change',()=>{
 const {s,r,e}=fixture();r.turrets=[{x:480,y:300,time:14,clock:0,aim:0,build:weaponSnapshot(s.player)}];s.player.critChance=0;
 const result=stepRun(s,.1);assert.ok(result.damageResults.some(f=>f.critical));assert.equal(10000-e.hp,25.5);assert.equal(s.critical.criticalHits,1);
});
test('solar fairy burn inherits its actual shot result instead of rerolling each tick',()=>{
 const {s,r,e}=fixture();s.player.sunFairy=1;s.passiveClocks={sunFairy:0};tickPassives(s,0);const b=s.projectiles.find(b=>b.passive==='sunFairy');assert.ok(b);s.player.critChance=0;passiveHit(s,b,e);
 assert.equal(e.fairyBurn.criticalSnapshot.critical,true);const random=s.critical.randomState,before=e.hp;tickPassives(s,.1);assert.ok(e.hp<before);assert.equal(s.critical.randomState,random);assert.equal(s.critical.criticalHits,1);
});
test('shared ongoing snapshot aliases are rejoined after serialization and do not recount a victim',()=>{
 const {s,r,e}=fixture();s.player.poison=1;hitEnemy(s.player,e,r.enemies,[],1,true,r,s.player,{primary:true});const saved=parseSave(encodeSave(s)),loaded=currentRoom(saved).enemies[0];
 assert.equal(loaded.poisonStacks[0].criticalSnapshot,loaded.poisonGasCritical.criticalSnapshot);assert.equal(loaded.poisonGasCritical.criticalSnapshot,loaded.poisonBlastCritical.criticalSnapshot);
 bindCriticalRun(saved,[loaded]);tickElements(currentRoom(saved),.1);assert.equal(saved.critical.criticalHits,1);assert.ok(drainDamageResults(saved).length>0);
});
test('a zero-duration update does not reroll legacy poison, burn or passive DOT applications',()=>{
 const {s,e}=fixture();e.burn=2;e.burnDamage=6;e.burnStacks=[{time:2,dps:6}];e.poisonRadius=42;e.poisonLevel=1;e.poisonStacks=[{time:2,dps:8}];e.fairyBurn={time:2,dps:6};e.bladeDot={time:1,dps:4,kind:'fire'};
 const before=s.critical.randomState,result=stepRun(s,0);assert.equal(s.critical.randomState,before);assert.equal(s.critical.hits,0);assert.deepEqual(result.damageResults,[]);
});
test('hostile projectiles never use player critical stats',()=>{
 const {s}=fixture();s.invulnerable=0;s.projectiles=[{x:480,y:300,vx:0,vy:0,life:1,enemy:true,damage:9,hit:[]}];const random=s.critical.randomState;
 stepRun(s,.01);assert.equal(s.player.hp,4);assert.equal(s.critical.hits,0);assert.equal(s.critical.randomState,random);
});
test('precision burst and critical feedback identify the same real hit for the visual layer',()=>{
 const {s,e}=fixture();s.player.precision=1;e.precisionHits=2;e.precisionTime=4;s.projectiles=[{x:490,y:300,vx:420,vy:0,life:3,enemy:false,pierce:0,hit:[],element:'precision',elemental:true,primary:true}];
 const result=stepRun(s,.1),burst=result.effects.find(f=>f.precisionBurst),hit=result.damageResults.find(f=>f.source==='arrow');assert.ok(burst&&hit?.critical);assert.equal(burst.attackId,hit.attackId);assert.equal(hit.procEligible,true);
});
test('a legacy continuous exposure blocked by a shield never rolls or counts a hit',()=>{
 const {s,r,e}=fixture();Object.assign(e,{variant:'demon',part:'foot',demonShield:true});r.fireZones=[{x:e.x,y:e.y,r:40,time:1,dps:20}];bindCriticalRun(s,r.enemies);const before=s.critical.randomState;
 tickElements(r,.1);assert.equal(s.critical.randomState,before);assert.equal(s.critical.hits,0);assert.equal(e.hp,10000);
});
