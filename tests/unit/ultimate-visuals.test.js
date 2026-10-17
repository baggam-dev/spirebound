import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom} from '../../src/game/engine.js';
import {castUltimate,tickRain} from '../../src/combat/abilities.js';
import {tickPassives} from '../../src/progression/passives.js';
import {rainVisualState,turretVisualState} from '../../src/rendering/ultimate-visuals.js';
import {CROSSBOW} from '../../src/combat/combat-tuning.js';
function run(kind){const s=newRun(42);s.player.ultimate=1;s.player.evolutions={ultimate:kind};currentRoom(s).obstacles=[];currentRoom(s).enemies=[{id:1,type:'chaser',x:600,y:300,hp:1000,max:1000}];return s;}
test('rain landings coincide with six scaled damage pulses and expire at1.8 seconds',()=>{const s=run('burst'),r=currentRoom(s);castUltimate(s);assert.equal(r.enemies[0].hp,881);assert.equal(rainVisualState(r.arrowRain).impact,1);for(let i=1;i<6;i++){tickRain(s,.3);assert.equal(r.enemies[0].hp,1000-119*(i+1));assert.ok(Math.abs(rainVisualState(r.arrowRain).impact-1)<1e-9);}tickRain(s,.3);assert.equal(r.arrowRain,null);});

test('crossbow recoil follows an actual shot and remains idle without a target',()=>{
 const s=run('turret'),r=currentRoom(s);r.enemies=[];castUltimate(s);const t=r.turrets[0];assert.equal(turretVisualState(t).build,0);assert.equal(turretVisualState(t).recoil,0);
 tickPassives(s,.3);assert.equal(turretVisualState(t).build,1);assert.equal(turretVisualState(t).recoil,0);assert.equal(s.projectiles.length,0);
 r.enemies=[{id:1,type:'chaser',x:600,y:300,hp:1000,max:1000}];tickPassives(s,.01);assert.equal(turretVisualState(t).recoil,1);assert.equal(s.projectiles.length,1);assert.equal(t.clock,CROSSBOW.interval);
 tickPassives(s,.2);assert.equal(turretVisualState(t).recoil,0);assert.equal(s.projectiles.length,1);
});
test('ultimate poses are read-only, deterministic on pause and survive serialized state',()=>{
 for(const kind of ['burst','turret']){const s=run(kind);castUltimate(s);const obj=kind==='burst'?currentRoom(s).arrowRain:currentRoom(s).turrets[0],fn=kind==='burst'?rainVisualState:turretVisualState;
  const before=JSON.stringify(obj);Object.freeze(obj);assert.deepEqual(fn(obj),fn(JSON.parse(before)));assert.deepEqual(fn(obj),fn(obj));assert.equal(JSON.stringify(obj),before);
 }
 assert.equal(turretVisualState({time:0,clock:0}).opacity,0);assert.equal(turretVisualState({time:.6,clock:0}).opacity,.5);
});
