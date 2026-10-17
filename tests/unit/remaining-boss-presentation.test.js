import test from 'node:test';
import assert from 'node:assert/strict';
import {remainingBossKey,resetRemainingBossPresentation,clearRemainingBossActors,enterRemainingBossPresentation,startRemainingBosses,tickRemainingBossPresentation,notifyRemainingBossHits,remainingBossPose} from '../../src/rendering/remaining-boss-presentation.js';
import {enemyDeathEffect} from '../../src/rendering/enemy-feedback.js';
import {createPractice} from '../../src/game/boss-practice.js';
import {currentRoom} from '../../src/game/engine.js';
import {stepRun} from '../../src/game/simulation.js';
const actor=key=>({id:7,type:key==='kald'?'starKnight':key==='vera'?'astralSniper':'boss',gateTitle:['kald','vera'].includes(key)?key:undefined,variant:key==='slime'?'slime':['kald','vera'].includes(key)?undefined:'demon',part:key,hp:100,max:100,x:480,y:180,stage:0});
const hit=[{enemyFeedback:'hit',enemyId:7,beforeRatio:1,afterRatio:.96}];
test('remaining boss transforms preserve identity, clocks and saved actors',()=>{
 for(const key of ['slime','kald','vera','hand','foot','eye','nose','mouth']){
  resetRemainingBossPresentation();const e=actor(key),r={type:'boss',enemies:[e],hazards:[]},saved=JSON.stringify(r);assert.equal(remainingBossKey(e),key);startRemainingBosses(r);for(let i=0;i<5;i++)assert.equal(remainingBossPose(e).kind,'arrival');
  tickRemainingBossPresentation(r,.81);assert.equal(remainingBossPose(e),null);notifyRemainingBossHits(r,hit);assert.equal(remainingBossPose(e).kind,'hit');assert.equal(remainingBossPose(e,{reduced:true}),null);assert.equal(remainingBossPose(e,{staticPose:true}),null);tickRemainingBossPresentation(r,.17);assert.equal(remainingBossPose(e),null);assert.equal(JSON.stringify(r),saved);
 }
 assert.equal(remainingBossKey({type:'starKnight'}),null);assert.equal(remainingBossKey({variant:'demon',part:'core'}),null);assert.equal(remainingBossKey({type:'minislime'}),null);
});
test('entry history and phase-spawn events do not replay on load or slime splitting',()=>{
 const e=actor('slime'),r={type:'boss',enemies:[e]};resetRemainingBossPresentation([r]);r.seen=true;enterRemainingBossPresentation(r);assert.equal(remainingBossPose(e).kind,'arrival');clearRemainingBossActors();enterRemainingBossPresentation(r);assert.equal(remainingBossPose(e),null);resetRemainingBossPresentation([r]);enterRemainingBossPresentation(r);assert.equal(remainingBossPose(e),null);
 const body=actor('eye'),parts={type:'boss',demon:{phase:2},enemies:[body]};resetRemainingBossPresentation();tickRemainingBossPresentation(parts,.01,[],['demonPhase']);assert.equal(remainingBossPose(body).kind,'arrival');
 const child=actor('slime');child.stage=1;const split={enemies:[child]};tickRemainingBossPresentation(split,.01);assert.equal(remainingBossPose(child),null);
});
test('hazards, attacks and recovery cancel view reactions without altering any threat',()=>{
 const scenarios=[['slime',{phase:'splitJump'},{}],['slime',{}, {hazards:[{owner:7,phase:'warning'}]}],['kald',{darkAttack:{kind:'slash'}},{}],['vera',{darkFlash:{time:.2}},{}],['hand',{}, {demon:{attacks:[{owner:'hand'}]}}],['foot',{frozen:1},{}]];
 for(const [key,fields,roomFields] of scenarios){const e=actor(key),r={type:'boss',enemies:[e],...roomFields};resetRemainingBossPresentation();startRemainingBosses(r);Object.assign(e,fields);const saved=JSON.stringify(r);tickRemainingBossPresentation(r,.01,hit);assert.equal(remainingBossPose(e),null);assert.equal(JSON.stringify(r),saved);}
});
test('slime split stays immediate and distinct, final and named snapshots have no live references',()=>{
 const s=createPractice('slime','fire',42),r=currentRoom(s);s.attack=100;r.enemies[0].hp=0;const result=stepRun(s,0),f=result.effects.find(f=>f.enemyFeedback==='death');assert.equal(f.split,true);assert.equal(f.duration,.38);assert.equal(r.enemies.filter(e=>e.type==='boss').length,2);
 for(const key of ['slime','kald','vera','hand','foot','eye','nose','mouth']){const e=actor(key);e.hp=0;e.stage=2;const saved=JSON.stringify(e),death=enemyDeathEffect(e);assert.equal(death.remainingBoss,key);assert.equal(death.duration,1);assert.equal(Object.values(death).some(v=>v&&typeof v==='object'),false);assert.equal(JSON.stringify(e),saved);}
});
