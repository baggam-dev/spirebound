import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom} from '../../src/game/engine.js';
import {weaponSnapshot,emitWeaponVolley} from '../../src/combat/weapon-projectiles.js';
import {stepRun} from '../../src/game/simulation.js';
import {createCombatAudio} from '../../src/ui/combat-audio.js';
test('normal and crossbow repeat cues occur once when real delayed projectiles depart',()=>{
 for(const turret of [false,true]){
  const s=newRun(42),r=currentRoom(s),calls=[],audio=createCombatAudio({play:name=>calls.push(name)});
  s.attack=999;s.invulnerable=999;s.player.repeat=1;r.obstacles=[];r.enemies=[{id:1,type:'chaser',x:900,y:300,hp:10000,max:10000,frozen:999,cd:999}];
  emitWeaponVolley(s.projectiles,weaponSnapshot(s.player),s.player,r.enemies[0],1,turret);audio.prepare(s,r);
  let result=stepRun(s,.1);audio.update(s,r,result.effects,result.events);assert.deepEqual(calls,[]);
  result=stepRun(s,.07);audio.update(s,r,result.effects,result.events);const cue=turret?'crossbowRepeat':'repeatShot';assert.ok(result.events.includes(cue));assert.deepEqual(calls,[cue]);
  result=stepRun(s,.01);audio.update(s,r,result.effects,result.events);assert.deepEqual(calls,[cue]);
 }
});
test('existing delayed projectiles do not replay a cue merely on load or observer reset',()=>{
 const calls=[],audio=createCombatAudio({play:name=>calls.push(name)}),s={player:{}},r={turrets:[]};
 audio.prepare(s,r);audio.update(s,r);audio.reset();audio.update(s,r);assert.deepEqual(calls,[]);
 audio.prepare(s,r);audio.update(s,r,[],['repeatShot','repeatShot']);assert.deepEqual(calls,['repeatShot']);
});
