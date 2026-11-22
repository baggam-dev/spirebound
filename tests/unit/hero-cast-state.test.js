import test from 'node:test';
import assert from 'node:assert/strict';
import {heroCastIds,beginHeroCast,heroCastPose,tickHeroCast,clearHeroCast} from '../../src/rendering/hero-cast-state.js';
const run=()=>({status:'playing',elapsed:10,floor:0,room:0,floors:[[{enemies:[]},{enemies:[]}]],player:{hp:5,actionStun:0}});
test('six successful cast ids have distinct rows and advance without writing the run',()=>{
 for(const [row,id] of heroCastIds.entries()){
  const s=run(),before=JSON.stringify(s);assert.equal(beginHeroCast(s,id),true);
  for(const [age,frame] of [[0,0],[.08,1],[.2,2],[.32,3]])assert.deepEqual(heroCastPose(s.player,10+age),{id,row,frame});
  assert.equal(JSON.stringify(s),before);assert.equal(heroCastPose(s.player,10.4),null);
 }
});
test('failed, stunned, dead and rolling casts cannot start a presentation',()=>{
 assert.equal(beginHeroCast(run(),false),false);
 for(const change of [s=>s.player.hp=0,s=>s.player.actionStun=.2,s=>s.roll={},s=>s.status='lost']){
  const s=run();change(s);assert.equal(beginHeroCast(s,'guardian'),false);assert.equal(heroCastPose(s.player,10),null);
 }
});
test('roll, stun, death, room replacement, transition and explicit reset cancel rather than resume',()=>{
 for(const change of [s=>s.roll={},s=>s.player.actionStun=1,s=>s.player.hp=0,s=>s.room=1,s=>s.floors[0][0]={},s=>s.elapsed=9,s=>s.elapsed=11]){
  const s=run();beginHeroCast(s,'frostWave');change(s);tickHeroCast(s);assert.equal(heroCastPose(s.player,10),null);
 }
 const s=run();beginHeroCast(s,'focus');clearHeroCast(s.player);assert.equal(heroCastPose(s.player,10),null);
 beginHeroCast(s,'focus');clearHeroCast();assert.equal(heroCastPose(s.player,10),null);
});
test('reduced effects use brief release and recovery; reload does not inherit a cast',()=>{
 const s=run();beginHeroCast(s,'galeVeil');assert.equal(heroCastPose(s.player,10.08,{reduced:true}).frame,1);
 assert.equal(heroCastPose(s.player,10.2,{reduced:true}).frame,3);assert.equal(heroCastPose(s.player,10.25,{reduced:true}),null);
 const loaded=JSON.parse(JSON.stringify(s));assert.equal(heroCastPose(loaded.player,10),null);
});
