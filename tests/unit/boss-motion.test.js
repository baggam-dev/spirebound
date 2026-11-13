import test from 'node:test';
import assert from 'node:assert/strict';
import {clearRemnantMotion,tickRemnantMotion,remnantMotion,kingWeaponMotion} from '../../src/rendering/boss-motion.js';
import {DEMON_SWEEP} from '../../src/combat/demon-sweep.js';
const core={part:'core',hp:100};
test('core sweep uses the same anatomical side as damage and returns continuously to neutral',()=>{
 for(const [kind,index] of [['coreSweepLeft',1],['coreSweepRight',0]]){
  const room={demon:{}},attack={kind,time:0,windup:DEMON_SWEEP.windup};
  const prepared=remnantMotion(core,room,attack).arms;
  room.demon.sweepFlash={kind,time:DEMON_SWEEP.strike+DEMON_SWEEP.recover};
  const released=remnantMotion(core,room,null).arms;assert.deepEqual(released,prepared);assert.equal(released[1-index],0);assert.notEqual(released[index],0);
  room.demon.sweepFlash.time=0;assert.ok(remnantMotion(core,room,null).arms.every(v=>Math.abs(v)<1e-12));
 }
});
test('part release observes actual recovery, does not replay on load, and cancels on phase/reset/death',()=>{
 clearRemnantMotion();const e={part:'hand',remnantVersion:1,hp:100},room={enemies:[e],demon:{remnantVersion:1,phase:1,recovery:0,attack:{kind:'hand',owner:'hand',aim:0,time:.01}}};
 tickRemnantMotion(room);room.demon.attack=null;room.demon.recovery=.4;tickRemnantMotion(room);room.demon.recovery=.34;
 assert.ok(remnantMotion(e,room,null).lunge>0);const before=JSON.stringify(room);assert.deepEqual(remnantMotion(e,room,null),remnantMotion(e,room,null));assert.equal(JSON.stringify(room),before);
 assert.equal(remnantMotion(e,room,null,{reduced:true}).lunge,0);
 clearRemnantMotion();tickRemnantMotion(room);assert.equal(remnantMotion(e,room,null).lunge,0);
 room.demon.attack={kind:'hand',owner:'hand',aim:0};tickRemnantMotion(room);room.demon.attack=null;room.demon.recovery=.4;tickRemnantMotion(room);room.demon.phase=2;tickRemnantMotion(room);assert.equal(remnantMotion(e,room,null).lunge,0);
 room.demon.recovery=0;tickRemnantMotion(room);e.hp=0;assert.equal(remnantMotion(e,room,null).lunge,0);
});
test('king keeps spell flashes in casting pose, prepares from true fast slash clock, and preserves source state',()=>{
 const e={hp:29,max:100,bossPressureVersion:1,darkAttack:{kind:'slash',time:.32}},before=JSON.stringify(e);
 assert.equal(kingWeaponMotion(e).mix,0);assert.equal(JSON.stringify(e),before);
 e.darkFlash={kind:'judgment',time:.18};assert.equal(kingWeaponMotion(e).from,3);
 e.darkFlash={kind:'slash',time:.001};assert.ok(kingWeaponMotion(e).mix>.99);
 assert.equal(kingWeaponMotion(e,{reduced:true}).lean,0);assert.equal(kingWeaponMotion(e,{staticPose:true}).from,0);
});
