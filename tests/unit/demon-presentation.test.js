import test from 'node:test';
import assert from 'node:assert/strict';
import {clearDemonPresentation,tickDemonPresentation,notifyDemonHits,demonPresentationPose} from '../../src/rendering/demon-presentation-state.js';
import {enemyHitEffects,enemyDeathEffect} from '../../src/rendering/enemy-feedback.js';
import {createPractice} from '../../src/game/boss-practice.js';
import {currentRoom} from '../../src/game/engine.js';
import {stepRun} from '../../src/game/simulation.js';
const actor=part=>({id:0,type:'boss',variant:'demon',part,hp:100,max:100,x:480,y:145});
const room=()=>({demon:{phase:3,attacks:[]},enemies:[actor('core')]});
const hit=(loss=.01,core=true)=>[{enemyFeedback:'hit',enemyId:0,demonCore:core,beforeRatio:1,afterRatio:1-loss}];
test('core arrival starts only on actual phase-three spawn event and never from draw/load',()=>{
 clearDemonPresentation();const r=room(),e=r.enemies[0],saved=JSON.stringify(r);
 tickDemonPresentation(r,.1);assert.equal(demonPresentationPose(e,r),null);
 tickDemonPresentation(r,.01,[],['demonPhase']);for(let i=0;i<8;i++)assert.equal(demonPresentationPose(e,r),'arrival');
 tickDemonPresentation(r,.4);assert.equal(demonPresentationPose(e,r),'awaken');tickDemonPresentation(r,.41);assert.equal(demonPresentationPose(e,r),null);assert.equal(JSON.stringify(r),saved);
 tickDemonPresentation(r,.01,[],['demonPhase']);clearDemonPresentation();assert.equal(demonPresentationPose(e,r),null);const loaded=JSON.parse(saved);assert.equal(demonPresentationPose(loaded.enemies[0],loaded),null);
 for(const phase of [1,2]){const other={demon:{phase},enemies:[actor(phase===1?'hand':'eye')]};tickDemonPresentation(other,.01,[],['demonPhase']);assert.equal(demonPresentationPose(other.enemies[0],other),null);}
});
test('core hits distinguish reused part ids, have a cooldown and preserve actor/room state',()=>{
 clearDemonPresentation();const r=room(),e=r.enemies[0],saved=JSON.stringify(r);
 tickDemonPresentation(r,.01,hit(.03,false),['demonPhase']);assert.equal(demonPresentationPose(e,r),'arrival');
 notifyDemonHits(r,hit());assert.equal(demonPresentationPose(e,r),'light');notifyDemonHits(r,hit(.04));assert.equal(demonPresentationPose(e,r),'light');
 tickDemonPresentation(r,.11);assert.equal(demonPresentationPose(e,r),null);tickDemonPresentation(r,.14);notifyDemonHits(r,hit(.04));assert.equal(demonPresentationPose(e,r),'heavy');
 assert.equal(demonPresentationPose(e,r,{reduced:true}),null);assert.equal(demonPresentationPose(e,r,{staticPose:true}),null);
 tickDemonPresentation(r,.17);assert.equal(demonPresentationPose(e,r),null);assert.equal(JSON.stringify(r),saved);
 const part=actor('eye');part.hp=90;const effects=enemyHitEffects(new Map([[part,100]]),[part]);assert.equal(effects[0].demonCore,false);
 const body=actor('core');body.hp=90;assert.equal(enemyHitEffects(new Map([[body,100]]),[body])[0].demonCore,true);
});
test('attacks and specials immediately cancel presentation without extending combat clocks',()=>{
 for(const danger of [{attack:{owner:'core'}},{attacks:[{owner:'core'}]},{special:{kind:'ice'}},{flash:{time:.2}},{coreFlash:{time:.2}},{sweepFlash:{time:.2}},{force:{time:.2}}]){
  clearDemonPresentation();const r=room(),e=r.enemies[0];tickDemonPresentation(r,.01,[],['demonPhase']);Object.assign(r.demon,danger);const saved=JSON.stringify(r);
  assert.equal(demonPresentationPose(e,r),null);tickDemonPresentation(r,.01,hit(.04));assert.equal(demonPresentationPose(e,r),null);assert.equal(JSON.stringify(r),saved);
  for(const key of Object.keys(danger))delete r.demon[key];assert.equal(demonPresentationPose(e,r),null);
 }
 const r=room(),e=r.enemies[0];e.frozen=1;notifyDemonHits(r,hit(.04));assert.equal(demonPresentationPose(e,r),null);
});
test('only core death gets a one-second detached snapshot and all other timings stay intact',()=>{
 for(const part of ['hand','foot','eye','nose','mouth','core']){
  const e=actor(part);e.hp=0;const saved=JSON.stringify(e),f=enemyDeathEffect(e);assert.equal(f.demonCore,part==='core');assert.equal(f.duration,part==='core'?1:.55);assert.equal(JSON.stringify(e),saved);
  assert.equal(Object.values(f).includes(e),false);
 }
 assert.equal(enemyDeathEffect({variant:'king',kingStage:3}).duration,1.1);assert.equal(enemyDeathEffect({variant:'commander',commander:{phase:2}}).duration,1);
});
test('actual phase spawn and final core removal keep key reward immediate and single',()=>{
 clearDemonPresentation();const s=createPractice('demon','fire',42);delete s.practice;s.attack=100;const r=currentRoom(s);
 for(const phase of [2,3]){
  for(const e of r.enemies)e.hp=0;
  const result=stepRun(s,0);assert.ok(result.events.includes('demonPhase'));assert.equal(r.demon.phase,phase);
  tickDemonPresentation(r,0,result.effects,result.events);
  if(phase===3)assert.equal(demonPresentationPose(r.enemies.find(e=>e.part==='core'),r),'arrival');
 }
 const body=r.enemies.find(e=>e.part==='core');body.hp=0;const result=stepRun(s,0);
 assert.ok(result.events.includes('key'));assert.equal(s.key,true);assert.equal(r.used,true);assert.equal(r.enemies.some(e=>e.part==='core'),false);
 const death=result.effects.filter(f=>f.enemyFeedback==='death'&&f.demonCore);assert.equal(death.length,1);assert.equal(death[0].t,1);
 assert.equal(stepRun(s,0).effects.some(f=>f.enemyFeedback==='death'&&f.demonCore),false);
});
