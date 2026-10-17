import test from 'node:test';
import assert from 'node:assert/strict';
import {resetPrismPresentation,clearPrismActors,enterPrismPresentation,tickPrismPresentation,notifyPrismHits,prismPresentationPose} from '../../src/rendering/prism-presentation-state.js';
import {enemyHitEffects,enemyDeathEffect} from '../../src/rendering/enemy-feedback.js';
import {bindDefenses,enemyDamageFactor} from '../../src/combat/enemy-defense.js';
import {createPractice} from '../../src/game/boss-practice.js';
import {currentRoom} from '../../src/game/engine.js';
import {stepRun} from '../../src/game/simulation.js';
const actor=()=>({id:7,type:'boss',variant:'prism',hp:100,max:100,x:480,y:180,cd:2});
const room=()=>({type:'boss',enemies:[actor()]});
const hit=(loss=.01)=>[{enemyFeedback:'hit',enemyId:7,beforeRatio:1,afterRatio:1-loss}];
test('Prism arrival is explicit first entry only with no draw, revisit or load replay',()=>{
 const r=room(),e=r.enemies[0];resetPrismPresentation([r]);r.seen=true;const saved=JSON.stringify(r);enterPrismPresentation(r);
 for(let i=0;i<8;i++)assert.equal(prismPresentationPose(e),'arrival');tickPrismPresentation([e],.4);assert.equal(prismPresentationPose(e),'awaken');tickPrismPresentation([e],.41);assert.equal(prismPresentationPose(e),null);assert.equal(JSON.stringify(r),saved);
 clearPrismActors();enterPrismPresentation(r);assert.equal(prismPresentationPose(e),null);resetPrismPresentation([r]);enterPrismPresentation(r);assert.equal(prismPresentationPose(e),null);
 for(const flags of [{practice:true},{returning:true}]){const other=room();resetPrismPresentation();enterPrismPresentation(other,flags);assert.equal(prismPresentationPose(other.enemies[0]),null);}
});
test('Prism hits respect threat recovery, cooldown, reduced and static views without actor writes',()=>{
 resetPrismPresentation();const e=actor(),saved=JSON.stringify(e);notifyPrismHits([e],hit());assert.equal(prismPresentationPose(e),'light');notifyPrismHits([e],hit(.04));assert.equal(prismPresentationPose(e),'light');tickPrismPresentation([e],.11);assert.equal(prismPresentationPose(e),null);tickPrismPresentation([e],.14);notifyPrismHits([e],hit(.04));assert.equal(prismPresentationPose(e),'heavy');
 assert.equal(prismPresentationPose(e,{reduced:true}),null);assert.equal(prismPresentationPose(e,{staticPose:true}),null);tickPrismPresentation([e],.17);assert.equal(prismPresentationPose(e),null);assert.equal(JSON.stringify(e),saved);
 for(const flags of [{prismPhase:'warning'},{prismPhase:'beam'},{prismPhase:'salvo'},{prismPhase:'recover'},{opening:1},{frozen:1}]){const r=room(),a=r.enemies[0];resetPrismPresentation();enterPrismPresentation(r);Object.assign(a,flags);const snapshot=JSON.stringify(a);tickPrismPresentation([a],.01,hit(.04));assert.equal(prismPresentationPose(a),null);assert.equal(JSON.stringify(a),snapshot);for(const key of Object.keys(flags))delete a[key];assert.equal(prismPresentationPose(a),null);}
});
test('shielded Prism reaction uses actual reduced health loss, preserving the shield rule',()=>{
 resetPrismPresentation();const e=actor(),summon={id:8,hp:100,summoned:true,summoner:e.id},enemies=[e,summon];bindDefenses(enemies);assert.equal(enemyDamageFactor(e),1/3);
 const before=new Map([[e,e.hp]]);e.hp-=3*enemyDamageFactor(e);notifyPrismHits(enemies,enemyHitEffects(before,enemies));assert.equal(prismPresentationPose(e),'light');tickPrismPresentation(enemies,.25);
 summon.hp=0;assert.equal(enemyDamageFactor(e),1);const next=new Map([[e,e.hp]]);e.hp-=3;notifyPrismHits(enemies,enemyHitEffects(next,enemies));assert.equal(prismPresentationPose(e),'heavy');
 const f=enemyDeathEffect({...e,hp:0,scale:1.2});assert.equal(f.prism,true);assert.equal(f.prismScale,1.2);assert.equal(f.duration,1);assert.equal(Object.values(f).some(v=>v&&typeof v==='object'),false);
});
test('Prism reward and summoned-enemy cleanup remain immediate and do not emit fake deaths',()=>{
 const s=createPractice('prism','fire',42);delete s.practice;s.attack=100;const r=currentRoom(s);for(const e of r.enemies)e.hp=0;r.enemies.push({id:100,type:'archer',x:600,y:100,hp:100,max:100,cd:3,summoned:true});
 const result=stepRun(s,0);assert.equal(r.used,true);assert.ok(result.events.includes('stairs'));assert.equal(r.enemies.some(e=>e.summoned),false);assert.equal(result.effects.filter(f=>f.enemyFeedback==='death'&&f.prism).length,1);assert.equal(result.effects.some(f=>f.enemyFeedback==='death'&&f.enemyId===100),false);assert.equal(stepRun(s,0).effects.some(f=>f.enemyFeedback==='death'&&f.prism),false);
});
