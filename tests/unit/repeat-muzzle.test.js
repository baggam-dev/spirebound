import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom} from '../../src/game/engine.js';
import {weaponSnapshot,emitWeaponVolley} from '../../src/combat/weapon-projectiles.js';
import {stepRun} from '../../src/game/simulation.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
import {drawUltimateStructures} from '../../src/progression/passives.js';
import {drawRepeatedCrossbowRelease} from '../../src/rendering/ultimate-visuals.js';
test('only the actual delayed crossbow departure emits a muzzle, at its original source rather than the moving hero',()=>{
 for(const turret of [false,true]){
  let s=newRun(42);const r=currentRoom(s);s.attack=999;s.invulnerable=999;s.player.repeat=1;r.obstacles=[];
  r.enemies=[{id:1,type:'chaser',x:900,y:300,hp:10000,max:10000,frozen:4,cd:999}];
  emitWeaponVolley(s.projectiles,weaponSnapshot(s.player),s.player,r.enemies[0],1,turret);
  assert.equal(stepRun(s,.1).effects.some(f=>f.turretMuzzle),false);s.player.x=520;
  const result=stepRun(s,.07),flashes=result.effects.filter(f=>f.turretMuzzle);
  assert.equal(flashes.length,turret?1:0);if(turret){assert.equal(flashes[0].x,480);assert.equal(flashes[0].angle,0);assert.equal(flashes[0].t,.09);}
  s=parseSave(encodeSave(s));assert.equal(stepRun(s,.01).effects.some(f=>f.turretMuzzle),false);
 }
});
test('repeat muzzle lives in the structure pass, follows the shot angle and restores draw state in both modes',()=>{
 for(const reduced of [false,true]){
  const calls=[],stack=[],state={globalAlpha:.6,globalCompositeOperation:'lighter'},c=new Proxy(state,{get:(t,k)=>k in t?t[k]:k==='save'?()=>stack.push({...t}):k==='restore'?()=>{const old=stack.pop();for(const key of Object.keys(t))delete t[key];Object.assign(t,old);}:(...args)=>calls.push([k,...args]),set:(t,k,v)=>(t[k]=v,true)});
  const s=newRun(42);currentRoom(s).turrets=[];const f=Object.freeze({turretMuzzle:true,x:480,y:300,angle:Math.PI/4,t:.09,duration:.09,color:'#e4cf9d'}),before=JSON.stringify(state),saved=JSON.stringify(s);
  drawUltimateStructures(c,s,reduced);assert.equal(calls.some(v=>v[0]==='stroke'),false);
  drawUltimateStructures(c,s,reduced,{effects:[f]});assert.ok(calls.some(v=>v[0]==='stroke'));assert.ok(calls.some(v=>v[0]==='rotate'&&v[1]===f.angle));
  assert.equal(JSON.stringify(state),before);assert.equal(JSON.stringify(s),saved);
  calls.length=0;assert.equal(drawRepeatedCrossbowRelease(c,{...f,t:0},reduced),false);assert.equal(calls.length,0);
 }
});
