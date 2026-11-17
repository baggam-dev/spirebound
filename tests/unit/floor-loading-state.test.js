import test from 'node:test';
import assert from 'node:assert/strict';
import {floorLoadMatches} from '../../src/ui/floor-loading-state.js';
test('a pending load deduplicates its own screen but cannot swallow resume after pause',()=>{
 const run={floor:0,key:false},task={run,floor:0,returning:false};
 assert.equal(floorLoadMatches(task,run,'floor-loading','floor-loading'),true);
 assert.equal(floorLoadMatches(task,run,'pause','floor-loading'),false);
 assert.equal(floorLoadMatches(task,run,'title','floor-loading'),false);
 assert.equal(floorLoadMatches(task,run,'floor-warmup','floor-loading'),false);
});
test('late floor completions reject changed runs, floors and return trips without mutating inputs',()=>{
 const run={floor:1,key:false},task={run,floor:1,returning:false},before=JSON.stringify({run,task});
 assert.equal(floorLoadMatches(task,{...run},'floor-loading','floor-loading'),false);
 run.floor=2;assert.equal(floorLoadMatches(task,run,'floor-loading','floor-loading'),false);run.floor=1;
 run.key=true;assert.equal(floorLoadMatches(task,run,'floor-loading','floor-loading'),false);run.key=false;
 assert.equal(JSON.stringify({run,task}),before);assert.equal(floorLoadMatches(null,run,'floor-loading','floor-loading'),false);
});
test('descent loading and ordinary loading do not share screen ownership',()=>{
 const run=Object.freeze({floor:3,key:true}),task=Object.freeze({run,floor:3,returning:true});
 assert.equal(floorLoadMatches(task,run,'journey-descent','journey-descent'),true);
 assert.equal(floorLoadMatches(task,run,'journey-descent','floor-loading'),false);
});
