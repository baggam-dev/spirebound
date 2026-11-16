import test from 'node:test';
import assert from 'node:assert/strict';
import {arrowImpactEffect} from '../../src/rendering/arrow-impact-visuals.js';
import {newRun,currentRoom} from '../../src/game/engine.js';
import {weaponSnapshot,emitWeaponVolley} from '../../src/combat/weapon-projectiles.js';
import {stepRun} from '../../src/game/simulation.js';
test('spent elemental arrows regain plain contact only when no element contact was emitted',()=>{
 for(const element of ['fire','frost','chain']){
  const a={element,vx:420,vy:0},point={x:100,y:100};assert.equal(arrowImpactEffect(a,point),null);
  a.elemental=false;assert.ok(arrowImpactEffect(a,point));assert.ok(arrowImpactEffect(a,point,[]));
  assert.equal(arrowImpactEffect(a,point,[{hitElement:'poison'}]),null);
 }
 assert.equal(arrowImpactEffect({element:'poison',elemental:false},{}),null);
 assert.equal(arrowImpactEffect({frostShard:true}, {},[]),null);
});
test('ordinary and crossbow fire arrows emit a visible contact on the second pierced target',()=>{
 for(const turret of [false,true]){
  const s=newRun(42),r=currentRoom(s);s.attack=999;s.invulnerable=999;r.obstacles=[];
  s.player.fire=1;s.player.pierce=1;
  r.enemies=[510,560].map((x,id)=>({id,type:'chaser',x,y:300,hp:10000,max:10000,frozen:999,cd:999}));
  const build=weaponSnapshot(s.player);emitWeaponVolley(s.projectiles,build,s.player,r.enemies[0],1,turret);
  const {effects}=stepRun(s,.2);
  assert.ok(r.enemies.every(e=>e.hp<10000));assert.equal(effects.filter(f=>f.hitElement==='fire').length,1);
  const contacts=effects.filter(f=>f.arrowImpact);assert.equal(contacts.length,1);assert.ok(contacts[0].x>520);
 }
});
