import test from 'node:test';import assert from 'node:assert/strict';
import {waitForAssets} from '../../src/rendering/asset-wait.js';
function clock(){let time=0,count=0,tick,cleared=false;return {options:{progress:()=>count,now:()=>time,idleMs:60,maxMs:300,schedule:fn=>(tick=fn,1),cancel:()=>{cleared=true;}},advance(t,done=0){time=t;count+=done;tick();},get cleared(){return cleared;}};}
test('file progress extends a slow load beyond an old fixed deadline and clears its watcher',async()=>{
 const c=clock();let complete;const waiting=waitForAssets(new Promise(r=>complete=r),c.options);
 for(let t=40;t<=240;t+=40)c.advance(t,1);complete(true);assert.equal(await waiting,true);assert.equal(c.cleared,true);
});
test('a stalled transfer fails and releases the watcher',async()=>{
 const c=clock(),waiting=waitForAssets(new Promise(()=>{}),c.options);c.advance(60);await assert.rejects(waiting,/stalled/);assert.equal(c.cleared,true);
});
test('continuous progress is still bounded and source errors surface immediately',async()=>{
 const c=clock(),waiting=waitForAssets(new Promise(()=>{}),c.options);for(let t=40;t<=280;t+=40)c.advance(t,1);c.advance(300,1);await assert.rejects(waiting,/limit/);assert.equal(c.cleared,true);
 const d=clock();await assert.rejects(waitForAssets(Promise.reject(Error('missing atlas')),d.options),/missing atlas/);assert.equal(d.cleared,true);
});
