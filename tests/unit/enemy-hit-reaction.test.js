import test from 'node:test';
import assert from 'node:assert/strict';
import {enemyHitProfile,freshEnemyContact} from '../../src/rendering/enemy-hit-profiles.js';
import {resetOrdinaryPresentation,tickOrdinaryPresentation,notifyOrdinaryHits,ordinaryPose} from '../../src/rendering/ordinary-presentation-state.js';
import {newRun} from '../../src/game/engine.js';
import {applyPlayerDamage,drainDamageResults} from '../../src/combat/critical.js';
const actor=type=>({id:7,type,hp:100,max:100,x:200,y:200});
const effect={enemyFeedback:'hit',enemyId:7,beforeRatio:1,afterRatio:.1};
const direct={enemyId:7,applied:true,damage:90,newHit:true,procDepth:0,source:'arrow',critical:false,hitDirection:-1};
test('projectile contact hints change neither damage, critical RNG nor saved run data',()=>{
 const a=newRun(42),b=structuredClone(a),ea=actor('chaser'),eb=actor('chaser');
 const plain=applyPlayerDamage(a,ea,10,{source:'arrow'}),hinted=applyPlayerDamage(b,eb,10,{source:'arrow',visualOrigin:{x:300,y:200}});
 assert.equal(hinted.hitDirection,-1);const {hitDirection,...rest}=hinted;assert.deepEqual(rest,plain);
 assert.deepEqual(a,b);assert.deepEqual(ea,eb);assert.equal(drainDamageResults(b)[0].hitDirection,-1);
 const zone=applyPlayerDamage(b,eb,10,{source:'allyZone',visualOrigin:{x:300,y:200}});assert.equal(zone.hitDirection,undefined);
 const vertical=applyPlayerDamage(b,eb,10,{source:'arrow',visualOrigin:{x:200,y:100}});assert.equal(vertical.hitDirection,undefined);
});
test('body durations differ by weight and large HP loss alone never becomes critical',()=>{
 for(const [type,duration] of [['chaser',.10],['archer',.12],['brute',.14]]){
  const e=actor(type);assert.equal(enemyHitProfile(e,direct).duration,duration);assert.equal(enemyHitProfile(e,direct).heavy,false);
  assert.equal(enemyHitProfile(e,{...direct,critical:true}).heavy,true);
  assert.equal(enemyHitProfile(e,{...direct,critical:true,newHit:false}).heavy,false);
 }
});
test('repeated attack and secondary damage keep loss evidence without fresh body reaction',()=>{
 const e=actor('archer');assert.equal(freshEnemyContact(e,[{...direct,newHit:false}]),null);
 assert.equal(freshEnemyContact(e,[{...direct,procDepth:1}]),null);
 assert.deepEqual(freshEnemyContact(e,[]),{});
 const room={seen:true,enemies:[e]};resetOrdinaryPresentation([room]);tickOrdinaryPresentation(room,.01);
 notifyOrdinaryHits(room,[effect],[direct]);const saved=JSON.stringify(e);tickOrdinaryPresentation(room,.04);
 const progress=ordinaryPose(e).progress;notifyOrdinaryHits(room,[effect],[{...direct,critical:true}]);
 assert.equal(ordinaryPose(e).progress,progress);assert.equal(ordinaryPose(e).heavy,false);assert.equal(JSON.stringify(e),saved);
 tickOrdinaryPresentation(room,.09);assert.equal(ordinaryPose(e),null);notifyOrdinaryHits(room,[effect],[direct]);assert.equal(ordinaryPose(e),null);
});
test('threats cancel the active response without replay after warning ends',()=>{
 for(const threat of [{meleeAttack:{stage:'windup'}},{phase:'air'},{attackPhase:'warning'},{frozen:1}]){
  const e=actor('chaser'),room={seen:true,enemies:[e]};resetOrdinaryPresentation([room]);tickOrdinaryPresentation(room,.01);
  notifyOrdinaryHits(room,[effect],[direct]);assert.equal(ordinaryPose(e).direction,-1);
  Object.assign(e,threat);tickOrdinaryPresentation(room,.01,[effect],[direct]);assert.equal(ordinaryPose(e),null);
  for(const key of Object.keys(threat))delete e[key];assert.equal(ordinaryPose(e),null);
 }
});
test('bosses, gate actors and pursuers retain no body flinch; reduced/static views stay quiet',()=>{
 for(const e of [{...actor('boss'),variant:'king'},{...actor('starKnight'),gateTitle:'칼드'},actor('pursuer')]){
  const room={seen:true,enemies:[e]};resetOrdinaryPresentation([room]);tickOrdinaryPresentation(room,.01,[effect],[direct]);assert.equal(ordinaryPose(e),null);
 }
 const e=actor('brute'),room={seen:true,enemies:[e]};resetOrdinaryPresentation([room]);tickOrdinaryPresentation(room,.01,[effect],[direct]);
 assert.equal(ordinaryPose(e,{reduced:true}),null);assert.equal(ordinaryPose(e,{staticPose:true}),null);
});
