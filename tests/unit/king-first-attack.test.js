import test from 'node:test';
import assert from 'node:assert/strict';
import {clearKingResurrection,tickKingResurrection,kingFirstAttack} from '../../src/rendering/king-resurrection.js';
import {kingWeaponMotion} from '../../src/rendering/boss-motion.js';
function awaken(){
 clearKingResurrection();const e={variant:'king',resurrectionVersion:1,hp:100,max:100,kingStage:2};tickKingResurrection([e],0);
 e.hp=29;e.kingStage=3;e.kingTransition=1.4;tickKingResurrection([e],0);e.kingTransition=0;tickKingResurrection([e],0);return e;
}
test('first warning belongs only to the first real attack and ends before chained strikes',()=>{
 const e=awaken();assert.equal(kingFirstAttack(e),null);e.darkAttack={kind:'slash',time:.32,step:0};tickKingResurrection([e],0);assert.equal(kingFirstAttack(e),e.darkAttack);
 const before=JSON.stringify(e);assert.equal(kingFirstAttack(e),e.darkAttack);assert.equal(JSON.stringify(e),before);
 e.darkAttack.step++;assert.equal(kingFirstAttack(e),null);tickKingResurrection([e],0);delete e.darkAttack;tickKingResurrection([e],0);
 e.darkAttack={kind:'judgment',time:.8,step:0};tickKingResurrection([e],0);assert.equal(kingFirstAttack(e),null);
});
test('reload, cleared room state and dead king do not replay the first warning',()=>{
 const e=awaken();clearKingResurrection();tickKingResurrection([e],0);e.darkAttack={kind:'slash',time:.32};tickKingResurrection([e],0);assert.equal(kingFirstAttack(e),null);
 const fresh=awaken();fresh.darkAttack={kind:'dash',time:.45};tickKingResurrection([fresh],0);assert.equal(kingFirstAttack(fresh),fresh.darkAttack);
 fresh.darkAttack.moving=true;assert.equal(kingFirstAttack(fresh),null);fresh.hp=0;tickKingResurrection([fresh],0);assert.equal(kingFirstAttack(fresh),null);
});
test('final transition settles within its existing clock and static/reduced modes keep representative poses',()=>{
 const e={kingStage:3,kingTransition:.28,hp:29,max:100};assert.equal(kingWeaponMotion(e).mix,0);
 e.kingTransition=.14;const before=JSON.stringify(e),pose=kingWeaponMotion(e);assert.ok(pose.mix>.49&&pose.mix<.51);assert.equal(pose.blocked,true);assert.equal(JSON.stringify(e),before);
 e.kingTransition=.001;assert.ok(kingWeaponMotion(e).mix>.99);assert.equal(kingWeaponMotion(e,{reduced:true}).mix,1);assert.equal(kingWeaponMotion(e,{staticPose:true}).from,0);
 e.kingTransition=0;assert.equal(kingWeaponMotion(e).from,0);assert.equal(kingWeaponMotion(e).blocked,false);
});
