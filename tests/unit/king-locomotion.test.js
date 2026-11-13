import test from 'node:test';
import assert from 'node:assert/strict';
import {kingLocomotionBlocked} from '../../src/rendering/boss-motion.js';
import {locomotion} from '../../src/rendering/locomotion.js';
import {bossPose} from '../../src/rendering/boss-poses.js';
import {updateUpper} from '../../src/combat/upper-floors.js';
const king=()=>({id:0,type:'boss',variant:'king',hp:1000,max:1000,x:480,y:180,cd:0,kingStage:1});
test('a king that moves and starts a cast in the same update plants its feet immediately',()=>{
 const e=king(),room={enemies:[e],obstacles:[]};locomotion(e,0);
 updateUpper(e,{x:800,y:400},room,.05,[],()=>{});
 assert.ok(Math.hypot(e.x-480,e.y-180)>0);assert.ok(e.darkAttack);
 const before=JSON.stringify(e),g=locomotion(e,.05,{blocked:kingLocomotionBlocked(e,bossPose(e))});
 assert.equal(g.moving,false);assert.equal(g.phase,0);assert.equal(JSON.stringify(e),before);
});
test('all king attack, recovery, freeze and transition states block walking with no actor writes',()=>{
 for(const state of [{darkAttack:{kind:'slash'}},{darkAttack:{kind:'judgment'}},{darkAttack:{kind:'dash',moving:true}},
  {darkFlash:{time:.18}},{opening:.4},{kneel:1},{kingTransition:1.4},{frozen:1},{hp:0}]){
  const e={...king(),...state},before=JSON.stringify(e);assert.equal(kingLocomotionBlocked(e),true);assert.equal(JSON.stringify(e),before);
 }
 const e=king();assert.equal(kingLocomotionBlocked(e),false);assert.equal(kingLocomotionBlocked(e,{stage:'windup'}),true);
 assert.equal(kingLocomotionBlocked(e,null),false);
});
test('blocking preserves gait phase and releasing without displacement does not replay a walking step',()=>{
 const e=king();locomotion(e,0);e.x+=5;const walking=locomotion(e,.1);assert.equal(walking.moving,true);
 e.x+=5;e.darkAttack={kind:'slash'};const held=locomotion(e,.2,{blocked:kingLocomotionBlocked(e)});
 assert.equal(held.moving,false);assert.equal(held.phase,walking.phase);
 delete e.darkAttack;assert.equal(locomotion(e,.2,{blocked:kingLocomotionBlocked(e)}).moving,false);
 assert.equal(locomotion(e,.3).moving,false);e.x+=5;assert.equal(locomotion(e,.4).moving,true);
 assert.equal(locomotion(e,.4,{reduced:true}).moving,false);assert.equal(locomotion(e,.4,{staticPose:true}).moving,false);
});
