import test from 'node:test';
import assert from 'node:assert/strict';
import {clearVelkarPresentation,startVelkarArrival,tickVelkarPresentation,notifyVelkarHits,velkarPresentationPose,velkarDeathPhase} from '../../src/rendering/velkar-presentation-state.js';
import {enemyDeathEffect} from '../../src/rendering/enemy-feedback.js';
const actor=phase=>({id:9,type:'boss',variant:'commander',hp:phase===1?100:40,max:100,x:480,y:180,commander:{phase}});
const hits=loss=>[{enemyFeedback:'hit',enemyId:9,beforeRatio:.8,afterRatio:.8-loss}];
test('Velkar arrival is explicit, update-timed and cleared on reload without actor writes',()=>{
 clearVelkarPresentation();const e=actor(1),saved=JSON.stringify(e);assert.equal(velkarPresentationPose(e),null);startVelkarArrival(e);
 for(let i=0;i<10;i++)assert.deepEqual(velkarPresentationPose(e),{phase:1,pose:'arrival'});
 tickVelkarPresentation([e],.4);assert.deepEqual(velkarPresentationPose(e),{phase:1,pose:'ready'});
 tickVelkarPresentation([e],.41);assert.equal(velkarPresentationPose(e),null);assert.equal(JSON.stringify(e),saved);
 startVelkarArrival(e);clearVelkarPresentation();assert.equal(velkarPresentationPose(e),null);assert.equal(velkarPresentationPose(JSON.parse(saved)),null);
});
test('Velkar hit poses respect both phases, cooldown, threat priority and reduced/static views',()=>{
 for(const phase of [1,2]){
  clearVelkarPresentation();const e=actor(phase),saved=JSON.stringify(e);notifyVelkarHits([e],hits(.01));assert.deepEqual(velkarPresentationPose(e),{phase,pose:'light'});
  notifyVelkarHits([e],hits(.04));assert.equal(velkarPresentationPose(e).pose,'light');tickVelkarPresentation([e],.11);assert.equal(velkarPresentationPose(e),null);
  tickVelkarPresentation([e],.14);notifyVelkarHits([e],hits(.04));assert.equal(velkarPresentationPose(e).pose,'heavy');
  assert.equal(velkarPresentationPose(e,{reduced:true}),null);assert.equal(velkarPresentationPose(e,{staticPose:true}),null);
  tickVelkarPresentation([e],.17);assert.equal(velkarPresentationPose(e),null);assert.equal(JSON.stringify(e),saved);
  for(const field of ['volley','snipe','ricochet','rain','blink']){
   const danger=actor(phase);danger.commander[field]={time:1};notifyVelkarHits([danger],hits(.04));assert.equal(velkarPresentationPose(danger),null);
  }
  startVelkarArrival(e);e.commander.volley={aim:0};tickVelkarPresentation([e],.01);delete e.commander.volley;assert.equal(velkarPresentationPose(e),null);
 }
});
test('Velkar transition resumes from combat state and lethal snapshot preserves the last phase',()=>{
 clearVelkarPresentation();const e=actor(2);e.commander.transition=1;assert.deepEqual(velkarPresentationPose(e),{phase:2,pose:'transition'});
 e.commander.transition=.2;assert.deepEqual(velkarPresentationPose(e),{phase:2,pose:'recover'});e.commander.transition=0;assert.equal(velkarPresentationPose(e),null);
 for(const phase of [1,2]){const dead=actor(phase);dead.hp=0;dead.commander.volley={aim:Math.PI};const saved=JSON.stringify(dead),f=enemyDeathEffect(dead,false,phase===1?100:40);assert.equal(f.commanderPhase,phase);assert.equal(f.duration,1);assert.equal(f.face,-1);assert.equal(JSON.stringify(dead),saved);}
 const legacy=actor(1);delete legacy.commander;legacy.hp=0;assert.equal(velkarDeathPhase(legacy,80),1);assert.equal(velkarDeathPhase(legacy,40),2);
 assert.equal(enemyDeathEffect({type:'archer'}).duration,.55);assert.equal(enemyDeathEffect({type:'boss',variant:'king',kingStage:2}).duration,1.1);
});
