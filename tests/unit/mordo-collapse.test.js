import test from 'node:test';
import assert from 'node:assert/strict';
import {collapseShake,MORDO_COLLAPSE_SECONDS} from '../../src/rendering/mordo-collapse.js';
import {createJourneyState,RETURN_REVEAL_SECONDS,FRESH_RETURN_SECONDS} from '../../src/ui/journey-state.js';

test('fresh Mordo collapse pauses run clocks and loaded or other boss notices retain short duration',()=>{
 for(const [fresh,mordo,duration] of [[true,true,FRESH_RETURN_SECONDS],[false,true,RETURN_REVEAL_SECONDS],[true,false,RETURN_REVEAL_SECONDS]]){
  const s={status:'playing',key:true,returnNoticePending:true,floor:9,room:1,elapsed:47},before=JSON.stringify(s),v=createJourneyState();v.beginReturn(s,{fresh,mordo});for(let i=0;i<16;i++)v.advance(s,.1);
  if(fresh&&mordo){assert.equal(v.finish(s),null);for(let i=0;i<10;i++)v.advance(s,.1);}
  assert.equal(v.current(s).elapsed,duration);assert.ok(v.finish(s));assert.equal(JSON.stringify(s),before);
 }
});
test('Mordo camera shake decays to rest and reduced effects or loaded scenes never move it',()=>{
 const token={kind:'return',fresh:true,mordo:true,elapsed:.1};assert.notDeepEqual(collapseShake(token),{x:0,y:0});assert.deepEqual(collapseShake(token,true),{x:0,y:0});assert.deepEqual(collapseShake({...token,fresh:false}),{x:0,y:0});assert.deepEqual(collapseShake({...token,mordo:false}),{x:0,y:0});const end=collapseShake({...token,elapsed:MORDO_COLLAPSE_SECONDS});assert.ok(Math.abs(end.x)+Math.abs(end.y)===0);
});
