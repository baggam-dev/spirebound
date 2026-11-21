import test from 'node:test';
import assert from 'node:assert/strict';
import {createEscapeState,ESCAPE_DURATION,ESCAPE_CUES,escapeMotion} from '../../src/ui/escape-state.js';
import {newRun} from '../../src/game/engine.js';
import {RunStore,HISTORY_KEY} from '../../src/persistence/storage.js';
const won=()=>({...newRun(77),status:'won'});
test('only a successfully recorded ordinary win can queue a survival scene',()=>{
 const state=createEscapeState(),run=won();
 for(const candidate of [{...run,status:'dead'},{...run,status:'playing'},{...run,practice:true}])assert.equal(state.queue(candidate,{ok:true}),false);
 assert.equal(state.queue(run,{ok:false}),false);assert.equal(state.queue(run,{ok:true}),true);
 assert.equal(state.start({...run}),false);assert.equal(state.start(run),true);
});
test('queued art has an independent bounded wait; cancelling consumes late art',()=>{
 const state=createEscapeState(),run=won();state.queue(run,{ok:true});
 assert.equal(state.advance(run,100),false);assert.equal(state.time(run),.1);
 for(let i=0;i<8;i++)state.advance(run,.1);
 assert.equal(state.advance(run,0),true);assert.equal(state.finish(run),true);assert.equal(state.start(run),false);assert.equal(state.queue(run,{ok:true}),false);
});
test('seven-second survival clock freezes all run fields and skips invalid deltas',()=>{
 const state=createEscapeState(),run=won(),before=JSON.stringify(run);state.queue(run,{ok:true});state.advance(run,.1);state.start(run);
 for(const dt of [NaN,Infinity,0,-1])assert.equal(state.advance(run,dt),false);
 assert.equal(state.time(run),0);for(let i=0;i<Math.ceil(ESCAPE_DURATION*10)+1;i++)state.advance(run,.1);
 assert.equal(state.advance(run,0),true);assert.equal(JSON.stringify(run),before);state.finish(run);assert.equal(state.active(run),false);
});
test('state changes or another run cannot resume the ending',()=>{
 const state=createEscapeState(),run=won();state.queue(run,{ok:true});assert.equal(state.queued(won()),false);
 run.status='playing';assert.equal(state.start(run),false);assert.equal(state.advance(run,.1),true);state.cancel();run.status='won';assert.equal(state.start(run),false);
});
test('record precedes survival and remains single after skip/auto/reload tombstone',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)},store=new RunStore(storage),run=newRun(77),state=createEscapeState();
 assert.equal(store.write(run).ok,true);run.status='won';const result=store.complete(run,true),snapshot=JSON.stringify([...data]);
 assert.equal(state.queue(run,result),true);state.start(run);for(let i=0;i<Math.ceil(ESCAPE_DURATION*10)+1;i++)state.advance(run,.1);state.finish(run);state.cancel();
 assert.equal(JSON.stringify([...data]),snapshot);assert.equal(JSON.parse(data.get(HISTORY_KEY)).filter(r=>r.id===run.runId).length,1);assert.equal(store.read().run,undefined);
});

test('ending cuts keep scale fixed, stop before breathing and preserve bow-facing sheets',()=>{
 for(const [from,to,sheet] of [[1.2,2.79,'front'],[3,4.79,'actions'],[4.8,6.99,'rear']]){
  const poses=Array.from({length:12},(_,i)=>escapeMotion(from+(to-from)*i/11));
  assert.ok(poses.every(p=>p.sheet===sheet&&p.height===poses[0].height));
  assert.ok(poses.every(p=>p.frame>=0&&p.frame<4));
  assert.ok(new Set(poses.map(p=>p.frame)).size>1);
 }
 assert.equal(escapeMotion(2.99).feet,escapeMotion(3).feet);
 assert.equal(escapeMotion(3.9).frame,2);assert.equal(escapeMotion(4.6).frame,3);
 assert.equal(escapeMotion(4.89).subtitle,false);assert.equal(escapeMotion(5.5).subtitle,true);
 assert.equal(escapeMotion(6.9).subtitle,false);assert.equal(escapeMotion(7).fade,1);
});
test('ending cues remain within the presentation clock and reduced poses are bounded',()=>{
 let previous=0;for(const [at,cue] of ESCAPE_CUES){assert.ok(at>previous&&at<ESCAPE_DURATION);assert.ok(cue);previous=at;}
 assert.equal(escapeMotion(NaN).phase,0);assert.equal(escapeMotion(Infinity).phase,0);
 for(let t=0;t<=7;t+=.1){const p=escapeMotion(t,true);assert.equal(p.frame,p.phase===2?2:0);assert.ok([0,1].includes(p.opening));assert.ok(Number.isFinite(p.feet));}
});
