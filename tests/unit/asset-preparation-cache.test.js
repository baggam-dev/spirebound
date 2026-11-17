import test from 'node:test';
import assert from 'node:assert/strict';
import {createCachedPreparation} from '../../src/rendering/asset-wait.js';
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
function setup(){const timers=[],jobs=[];let calls=0;const prepare=createCachedPreparation(()=>{calls++;const job=deferred();jobs.push(job);return job.promise;},{schedule:fn=>{timers.push(fn);return fn;},cancel(){}});return {prepare,timers,jobs,calls:()=>calls};}
const flush=async()=>{for(let i=0;i<6;i++)await Promise.resolve();};
test('concurrent preparation shares work and a late success warms the next request without reviving timed-out callers',async()=>{
 const h=setup(),first=h.prepare();assert.equal(h.prepare(),first);await flush();h.timers[0]();assert.equal(await first,null);
 const art={frames:8};h.jobs[0].resolve(art);await flush();assert.equal(await first,null);assert.equal(await h.prepare(),art);assert.equal(h.calls(),1);
});
test('an obsolete late success never overwrites a newer attempt',async()=>{
 const h=setup(),first=h.prepare();await flush();h.timers[0]();assert.equal(await first,null);
 const second=h.prepare();await flush();const newer={name:'new'};h.jobs[1].resolve(newer);assert.equal(await second,newer);
 h.jobs[0].resolve({name:'old'});await flush();assert.equal(await h.prepare(),newer);assert.equal(h.calls(),2);
});
test('failure and late rejection remain retryable without caching an empty result',async()=>{
 const h=setup(),first=h.prepare();await flush();h.timers[0]();assert.equal(await first,null);h.jobs[0].reject(Error('late failure'));await flush();
 const second=h.prepare();await flush();h.jobs[1].resolve(null);assert.equal(await second,null);
 const third=h.prepare();await flush();const art={ready:true};h.jobs[2].resolve(art);assert.equal(await third,art);assert.equal(h.calls(),3);
});
