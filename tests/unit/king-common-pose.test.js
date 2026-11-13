import test from 'node:test';
import assert from 'node:assert/strict';
import {bossPose} from '../../src/rendering/boss-poses.js';
import {startUpperAttack,updateUpper,tickUpperState} from '../../src/combat/upper-floors.js';
import {clearMordoPresentation,notifyMordoHits,mordoPresentationPose,tickMordoPresentation} from '../../src/rendering/mordo-presentation-state.js';
const king=pressure=>({id:0,type:'boss',variant:'king',hp:250,max:1000,bossPressureVersion:pressure,kingStage:3,x:480,y:180,guardClock:999});
test('common king pose reads each real judgment warning clock for regular and fast kings',()=>{
 for(const pressure of [0,1]){
  const e=king(pressure),p={x:900,y:480},room={obstacles:[],enemies:[e]};startUpperAttack(e,'judgment',p,room);
  assert.equal(bossPose(e).charge,0);const first=e.darkAttack.time;
  updateUpper(e,p,room,first/2,[],()=>{});assert.ok(Math.abs(bossPose(e).charge-.5)<1e-10);
  updateUpper(e,p,room,first/2,[],()=>{});
  assert.equal(bossPose(e).stage,'windup');assert.equal(bossPose(e).charge,0);
  tickUpperState(e,p,room,.18,[]);updateUpper(e,p,room,.18,[],()=>{});
  assert.equal(bossPose(e).stage,'windup');assert.ok(Math.abs(bossPose(e).charge-.18/(pressure?.42:.65))<1e-10);
  for(let i=0;i<3;i++)updateUpper(e,p,room,e.darkAttack.time,[],()=>{});
  assert.equal(e.darkAttack.finisher,true);assert.equal(bossPose(e).stage,'windup');assert.equal(bossPose(e).charge,0);
 }
});
test('common king combo pose exposes followup preparation while preserving the final strike',()=>{
 for(const pressure of [0,1]){
  const e=king(pressure),p={x:900,y:480},room={obstacles:[],enemies:[e]};startUpperAttack(e,'slash',p,room);
  const duration=e.darkAttack.time;updateUpper(e,p,room,duration,[],()=>{});
  assert.ok(e.darkFlash.time>0);assert.equal(bossPose(e).stage,'windup');assert.equal(bossPose(e).charge,0);
  updateUpper(e,p,room,duration/2,[],()=>{});assert.ok(Math.abs(bossPose(e).charge-.5)<1e-10);
  updateUpper(e,p,room,duration/2,[],()=>{});updateUpper(e,p,room,e.darkAttack.time,[],()=>{});
  assert.equal(e.darkAttack,undefined);assert.equal(bossPose(e).stage,'strike');
  const saved=JSON.stringify(e);bossPose(e);assert.equal(JSON.stringify(e),saved);
 }
});
test('a hit pose already in progress yields immediately to a new attack and is not replayed afterwards',()=>{
 clearMordoPresentation();const e=king(1);
 notifyMordoHits([e],[{enemyFeedback:'hit',enemyId:0,beforeRatio:.3,afterRatio:.27}]);assert.equal(mordoPresentationPose(e).pose,'heavy');
 e.darkAttack={kind:'slash',step:0,time:.32};assert.equal(mordoPresentationPose(e),null);
 tickMordoPresentation([e],.01);delete e.darkAttack;assert.equal(mordoPresentationPose(e),null);
});
