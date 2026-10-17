import test from 'node:test';
import assert from 'node:assert/strict';
import {resetWardenPresentation,clearWardenActors,enterWardenPresentation,tickWardenPresentation,notifyWardenHits,wardenPresentationPose,rememberWardenFacing} from '../../src/rendering/warden-presentation-state.js';
import {enemyDeathEffect} from '../../src/rendering/enemy-feedback.js';
import {createPractice} from '../../src/game/boss-practice.js';
import {currentRoom} from '../../src/game/engine.js';
import {stepRun} from '../../src/game/simulation.js';
const actor=()=>({id:7,type:'boss',hp:100,max:100,x:480,y:180,cd:2});
const room=()=>({type:'boss',enemies:[actor()]});
const hit=(loss=.01)=>[{enemyFeedback:'hit',enemyId:7,beforeRatio:1,afterRatio:1-loss}];
test('Warden first-entry arrival is update-timed and does not replay after visit or load',()=>{
 const r=room(),e=r.enemies[0];resetWardenPresentation([r]);r.seen=true;const saved=JSON.stringify(r);enterWardenPresentation(r);
 for(let i=0;i<8;i++)assert.equal(wardenPresentationPose(e),'arrival');tickWardenPresentation([e],.4);assert.equal(wardenPresentationPose(e),'ready');tickWardenPresentation([e],.41);assert.equal(wardenPresentationPose(e),null);assert.equal(JSON.stringify(r),saved);
 clearWardenActors();enterWardenPresentation(r);assert.equal(wardenPresentationPose(e),null);
 resetWardenPresentation([r]);enterWardenPresentation(r);assert.equal(wardenPresentationPose(e),null);
 for(const flags of [{practice:true},{returning:true}]){const other=room();resetWardenPresentation();enterWardenPresentation(other,flags);assert.equal(wardenPresentationPose(other.enemies[0]),null);}
 const used=room();used.used=true;resetWardenPresentation();enterWardenPresentation(used);assert.equal(wardenPresentationPose(used.enemies[0]),null);
});
test('Warden weak and strong hits respect cooldown, static/reduced and every combat pose priority',()=>{
 resetWardenPresentation();const e=actor(),saved=JSON.stringify(e);notifyWardenHits([e],hit());assert.equal(wardenPresentationPose(e),'light');notifyWardenHits([e],hit(.04));assert.equal(wardenPresentationPose(e),'light');
 tickWardenPresentation([e],.11);assert.equal(wardenPresentationPose(e),null);tickWardenPresentation([e],.14);notifyWardenHits([e],hit(.04));assert.equal(wardenPresentationPose(e),'heavy');
 assert.equal(wardenPresentationPose(e,{reduced:true}),null);assert.equal(wardenPresentationPose(e,{staticPose:true}),null);tickWardenPresentation([e],.17);assert.equal(wardenPresentationPose(e),null);assert.equal(JSON.stringify(e),saved);
 for(const flags of [{attackPhase:'warning'},{attackPhase:'leap'},{attackPhase:'firing'},{attackPhase:'recover'},{opening:1},{frozen:1},{kneel:1}]){
  const r=room(),a=r.enemies[0];resetWardenPresentation();enterWardenPresentation(r);Object.assign(a,flags);const snapshot=JSON.stringify(a);assert.equal(wardenPresentationPose(a),null);tickWardenPresentation([a],.01,hit(.04));assert.equal(JSON.stringify(a),snapshot);for(const key of Object.keys(flags))delete a[key];assert.equal(wardenPresentationPose(a),null);
 }
 for(const variant of ['king','commander','demon','prism','slime']){const a={...actor(),variant};notifyWardenHits([a],hit(.04));assert.equal(wardenPresentationPose(a),null);}
});
test('Warden detached death preserves the displayed direction and leaves other boss durations alone',()=>{
 resetWardenPresentation();const e=actor();e.hp=0;e.patternAim=0;e.scale=1.2;rememberWardenFacing(e,-1);const saved=JSON.stringify(e),f=enemyDeathEffect(e);
 assert.equal(f.warden,true);assert.equal(f.face,-1);assert.equal(f.wardenScale,1.2);assert.equal(f.t,1);assert.equal(f.duration,1);assert.equal(JSON.stringify(e),saved);assert.equal(Object.values(f).includes(e),false);
 assert.equal(enemyDeathEffect({type:'archer'}).duration,.55);assert.equal(enemyDeathEffect({type:'boss',variant:'king',kingStage:1}).duration,1.1);assert.equal(enemyDeathEffect({type:'boss',variant:'prism'}).duration,1);
});
test('Warden removal and reward are immediate despite its one-second visual snapshot',()=>{
 const s=createPractice('warden','fire',42);delete s.practice;s.attack=100;const r=currentRoom(s);for(const e of r.enemies)e.hp=0;
 const result=stepRun(s,0),death=result.effects.filter(f=>f.enemyFeedback==='death'&&f.warden);assert.equal(death.length,1);assert.equal(death[0].t,1);assert.equal(r.used,true);assert.ok(result.events.includes('stairs'));assert.equal(r.enemies.some(e=>e.type==='boss'),false);
 assert.equal(stepRun(s,0).effects.some(f=>f.enemyFeedback==='death'&&f.warden),false);
});
