import test from 'node:test';
import assert from 'node:assert/strict';
import {createJourneyState,RETURN_REVEAL_SECONDS,DESCENT_DARK_AT,DESCENT_SECONDS} from '../../src/ui/journey-state.js';
const run=()=>({status:'playing',runId:'a',floor:9,room:1,key:true,returnNoticePending:true,elapsed:123,skill:4,dodge:2,player:{hp:4}});

test('key reveal auto finishes without mutating rewards, clocks or saved pending state',()=>{
 const s=run(),before=JSON.stringify(s),v=createJourneyState();assert.equal(v.beginReturn(s,{fresh:true,origin:{x:480,y:145}}),true);
 assert.equal(v.beginReturn(s),false);for(let i=0;i<15;i++)v.advance(s,.1);v.advance(s,.01);
 assert.equal(v.current(s).elapsed,RETURN_REVEAL_SECONDS);assert.equal(v.finish(s).fresh,true);assert.equal(v.finish(s),null);assert.equal(JSON.stringify(s),before);
});

test('loaded notice has no fresh particles; skip and cancel cannot duplicate a reveal',()=>{
 const s=run(),v=createJourneyState();v.beginReturn(s);assert.equal(v.current(s).fresh,false);assert.equal(v.finish(s,{skip:true}).kind,'return');assert.equal(v.finish(s,{skip:true}),null);
 v.beginReturn(s,{fresh:true});v.cancel();assert.equal(v.advance(s,.1),false);assert.equal(s.returnNoticePending,true);
 v.beginReturn(s);assert.equal(v.current(s).fresh,false);v.cancel();s.returnNoticePending=false;assert.equal(v.beginReturn(s),false);
});

test('descent stays dark until ready; late work from a cancelled transition is ignored',()=>{
 const s=run(),v=createJourneyState();s.floor=8;assert.equal(v.beginDescent(s,9),true);const old=v.current(s);
 for(let i=0;i<100;i++)v.advance(s,.1);assert.equal(old.elapsed,DESCENT_DARK_AT);assert.equal(v.finish(s,{skip:true}),null);assert.equal(s.elapsed,123);
 v.cancel();v.beginDescent(s,9);assert.equal(v.markReady(s,old),false);const active=v.current(s);assert.equal(active.ready,false);assert.equal(v.markReady(s,active),true);
 for(let i=0;i<9;i++)v.advance(s,.1);assert.equal(active.elapsed,DESCENT_SECONDS);assert.equal(v.finish(s).kind,'descent');assert.equal(v.current(s),null);
});

test('journey ignores stale run/floor identity and invalid time without changing the save',()=>{
 const s=run(),v=createJourneyState();v.beginReturn(s);assert.equal(v.current({...s}),null);for(const dt of [-1,NaN,Infinity])v.advance(s,dt);assert.equal(v.current(s).elapsed,0);
 s.floor--;assert.equal(v.current(s),null);v.cancel();assert.equal(v.beginDescent(s,7),false);s.practice=true;assert.equal(v.beginReturn(s),false);
});
