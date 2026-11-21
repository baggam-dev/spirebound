import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrialSceneState} from '../../src/ui/trial-scene-state.js';
import {eliteCrest} from '../../src/rendering/elite-crest.js';
import {mergeEnemyFeedback} from '../../src/rendering/enemy-feedback.js';

const run=()=>({status:'playing',floor:0,room:0,elapsed:20,player:{hp:5},floors:[[{trialState:'active',enemies:[{hp:10}]}]]});
test('trial scenes keep combat and rewards immutable, guard early skips and play each live event once',()=>{
 const s=run(),before=JSON.stringify(s),v=createTrialSceneState();assert.ok(v.begin(s,'entry',{x:480,y:185}));
 assert.equal(v.finish(s,{skip:true}),false);v.advance(s,.1);v.advance(s,.1);assert.ok(v.finish(s,{skip:true}));
 assert.equal(v.begin(s,'entry',{x:480,y:185}),false);assert.equal(JSON.stringify(s),before);
 s.floors[0][0].trialState='reward';assert.ok(v.begin(s,'clear',{x:480,y:185}));
 for(let n=0;n<12;n++)v.advance(s,.1);assert.ok(v.finish(s));assert.equal(s.elapsed,20);assert.equal(s.player.hp,5);
});
test('trial tokens cannot finish another room, a resumed run or a changed encounter',()=>{
 const s=run(),v=createTrialSceneState();assert.equal(v.begin(s,'clear',{x:0,y:0}),false);v.begin(s,'entry',{x:480,y:185});
 s.floors[0].push({trialState:'active',enemies:[]});s.room=1;assert.equal(v.current(s),null);assert.equal(v.finish(s,{skip:true}),false);
 v.cancel();assert.equal(v.current(s),null);s.practice={};assert.equal(v.begin(s,'entry',{x:0,y:0}),false);
 delete s.practice;const loaded=JSON.parse(JSON.stringify(s));assert.equal(v.current(loaded),null);
});
test('elite crest excludes ordinary enemies, summoned bodies and bosses, while death bodies stay within existing budgets',()=>{
 assert.equal(eliteCrest({type:'chaser'}),null);assert.equal(eliteCrest({type:'chaser',elite:'guardian',summoned:true}),null);
 assert.equal(eliteCrest({type:'boss',elite:'guardian'}),null);assert.equal(eliteCrest({type:'chaser',elite:'guardian',trialChampion:true}),'trial');
 assert.equal(eliteCrest({type:'pursuer'}),'pursuer');
 const incoming=Array.from({length:30},(_,enemyId)=>({enemyFeedback:'death',enemyId,crest:'guardian',t:.5,duration:.55}));
 const snapshot=JSON.stringify(incoming),bounded=mergeEnemyFeedback([],incoming);
 assert.equal(bounded.length,24);assert.equal(bounded.filter(f=>f.crest).length,6);assert.equal(JSON.stringify(incoming),snapshot);
});
