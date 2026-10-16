import test from 'node:test';
import assert from 'node:assert/strict';
import {clearMordoPresentation,startMordoArrival,tickMordoPresentation,notifyMordoHits,mordoPresentationPose,mordoDeathPhase} from '../../src/rendering/mordo-presentation-state.js';
import {enemyDeathEffect} from '../../src/rendering/enemy-feedback.js';
const king=phase=>({id:3,type:'boss',variant:'king',hp:phase===1?100:phase===2?50:20,max:100,kingStage:phase,x:480,y:180});
const hit=(loss=.01)=>[{enemyFeedback:'hit',enemyId:3,beforeRatio:.7,afterRatio:.7-loss}];
test('arrival is explicit, uses update time, and does not replay after reset or load',()=>{
 clearMordoPresentation();const e=king(1),saved=JSON.stringify(e);assert.equal(mordoPresentationPose(e),null);startMordoArrival(e);
 assert.deepEqual(mordoPresentationPose(e),{phase:1,pose:'arrival'});for(let i=0;i<10;i++)mordoPresentationPose(e);assert.deepEqual(mordoPresentationPose(e),{phase:1,pose:'arrival'});
 tickMordoPresentation([e],.45);assert.deepEqual(mordoPresentationPose(e),{phase:1,pose:'awaken'});tickMordoPresentation([e],.46);assert.equal(mordoPresentationPose(e),null);assert.equal(JSON.stringify(e),saved);
 startMordoArrival(e);clearMordoPresentation();assert.equal(mordoPresentationPose(e),null);assert.equal(mordoPresentationPose(JSON.parse(saved)),null);
});
test('all three hit forms respect cooldown and threat, freeze, phase and reduced priorities',()=>{
 for(const phase of [1,2,3]){
  clearMordoPresentation();const e=king(phase),before=JSON.stringify(e);notifyMordoHits([e],hit());assert.deepEqual(mordoPresentationPose(e),{phase,pose:'light'});
  notifyMordoHits([e],hit(.04));assert.equal(mordoPresentationPose(e).pose,'light');tickMordoPresentation([e],.25);notifyMordoHits([e],hit(.04));assert.deepEqual(mordoPresentationPose(e),{phase,pose:'heavy'});
  assert.equal(mordoPresentationPose(e,{reduced:true}),null);assert.equal(mordoPresentationPose(e,{staticPose:true}),null);assert.equal(JSON.stringify(e),before);
  for(const threat of [{darkAttack:{kind:'slash'}},{kingTransition:1},{kneel:1},{frozen:1},{opening:1}]){
   const actor={...king(phase),...threat};notifyMordoHits([actor],hit(.04));assert.equal(mordoPresentationPose(actor),null);
  }
  e.hp=phase===1?50:phase===2?20:0;tickMordoPresentation([e],.01);assert.equal(mordoPresentationPose(e),null);
 }
});
test('lethal snapshots preserve the visible phase instead of dead hp forcing phase three',()=>{
 for(const phase of [1,2,3]){const e=king(phase);e.hp=0;const before=JSON.stringify(e),f=enemyDeathEffect(e,false,phase===1?100:phase===2?50:20);assert.equal(f.kingPhase,phase);assert.equal(f.duration,1.1);assert.equal(f.t,1.1);assert.equal(JSON.stringify(e),before);}
 const e=king(1);delete e.kingStage;e.hp=0;assert.equal(mordoDeathPhase(e,90),1);assert.equal(mordoDeathPhase(e,50),2);assert.equal(mordoDeathPhase(e,20),3);
 const normal=enemyDeathEffect({type:'archer',x:1,y:2,id:4});assert.equal(normal.duration,.55);
});
