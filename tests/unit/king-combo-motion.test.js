import test from 'node:test';
import assert from 'node:assert/strict';
import {startUpperAttack,updateUpper,tickUpperState} from '../../src/combat/upper-floors.js';
import {kingWeaponMotion} from '../../src/rendering/boss-motion.js';
const pose=m=>m.mix<.5?m.from:m.to;
function combo(){const e={id:0,type:'boss',variant:'king',hp:250,max:1000,bossPressureVersion:1,kingStage:3,x:480,y:180,guardClock:999},p={x:900,y:480},room={obstacles:[],enemies:[e]};startUpperAttack(e,'slash',p,room);return {e,p,room};}
test('each fast followup shows its next preparation while the last hit flash is still alive',()=>{
 const {e,p,room}=combo();updateUpper(e,p,room,.32,[],()=>{});
 for(const step of [1,2]){
  assert.equal(e.darkAttack.step,step);assert.equal(pose(kingWeaponMotion(e)),2);
  tickUpperState(e,p,room,.112,[]);updateUpper(e,p,room,.112,[],()=>{});
  assert.ok(e.darkFlash.time>0);assert.equal(pose(kingWeaponMotion(e)),1);
  const before=JSON.stringify(e);kingWeaponMotion(e);assert.equal(JSON.stringify(e),before);
  updateUpper(e,p,room,e.darkAttack.time,[],()=>{});
 }
 assert.equal(e.darkAttack,undefined);assert.equal(pose(kingWeaponMotion(e)),2);
});
test('body preparation stays continuous when a combo ground flash expires',()=>{
 const {e}=combo();e.darkAttack.step=1;e.darkAttack.time=.141;e.darkFlash={kind:'slash',step:0,time:.001};
 const before=kingWeaponMotion(e);delete e.darkFlash;e.darkAttack.time=.139;const after=kingWeaponMotion(e);
 assert.equal(pose(before),1);assert.equal(pose(after),1);assert.ok(Math.abs(before.lean-after.lean)<.001);
});
test('combo reduced and static poses stay stable and the final strike still recovers',()=>{
 const {e}=combo();e.darkAttack.step=2;e.darkFlash={kind:'slash',step:1,time:.18};
 assert.equal(pose(kingWeaponMotion(e,{reduced:true})),1);assert.equal(kingWeaponMotion(e,{reduced:true}).lean,0);
 assert.equal(pose(kingWeaponMotion(e,{staticPose:true})),0);
 delete e.darkAttack;e.darkFlash={kind:'slash',step:2,time:.001};assert.equal(pose(kingWeaponMotion(e)),0);
 e.darkFlash={kind:'judgment',time:.18};assert.equal(pose(kingWeaponMotion(e)),3);
});
