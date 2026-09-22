import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom} from './engine.js';
import {castUltimate,tickRain} from './abilities.js';
import {tickPassives} from './passives.js';
import {rainVisualState,turretVisualState} from './ultimate-visuals.js';
import {CROSSBOW} from './combat-tuning.js';
function run(kind){const s=newRun(42);s.player.ultimate=1;s.player.evolutions={ultimate:kind};currentRoom(s).obstacles=[];currentRoom(s).enemies=[{id:1,type:'chaser',x:600,y:300,hp:1000,max:1000}];return s;}
test('rain landings coincide with all three damage pulses including immediate first impact',()=>{
 const s=run('burst'),r=currentRoom(s);castUltimate(s);assert.equal(r.enemies[0].hp,940);assert.equal(rainVisualState(r.arrowRain).impact,1);
 tickRain(s,.59);assert.equal(r.enemies[0].hp,940);assert.equal(rainVisualState(r.arrowRain).impact,0);assert.ok(rainVisualState(r.arrowRain).fall>.9);
 tickRain(s,.01);assert.equal(r.enemies[0].hp,880);assert.equal(rainVisualState(r.arrowRain).impact,1);
 tickRain(s,.6);assert.equal(r.enemies[0].hp,820);assert.equal(rainVisualState(r.arrowRain).impact,1);assert.equal(rainVisualState(r.arrowRain).fall,0);
 tickRain(s,.59);assert.equal(rainVisualState(r.arrowRain).impact,0);assert.equal(rainVisualState(r.arrowRain).fall,0);tickRain(s,.01);assert.equal(r.arrowRain,null);
});
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
