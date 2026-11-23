import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceDamageNumbers,damageNumberLabels,resetDamageNumbers,combatLabelsWithDamage,formatDamageNumber} from '../../src/rendering/damage-numbers.js';
const hit=(extra={})=>({enemyId:1,applied:true,damage:10,criticalDamage:0,x:400,y:250,newHit:true,...extra});
test('sum actual applications including repeated DoT, separate targets and critical components without game writes',()=>{
 const run=Object.freeze({randomState:8,player:Object.freeze({hp:5})}),room=Object.freeze({}),before=JSON.stringify(run);
 advanceDamageNumbers(run,room,.01,[hit({damage:12}),hit({damage:8,newHit:false}),hit({damage:10,critical:true,criticalDamage:4}),hit({enemyId:2,damage:7}),hit({applied:false}),hit({damage:Infinity}),hit({x:NaN})]);
 const labels=damageNumberLabels(run);assert.equal(labels.length,3);
 assert.equal(labels.find(f=>f.enemyId===1&&!f.critical).amount,26);assert.equal(labels.find(f=>f.enemyId===1&&f.critical).amount,4);
 assert.equal(labels.find(f=>f.enemyId===2).amount,7);assert.equal(labels.reduce((sum,f)=>sum+f.amount,0),37);assert.equal(JSON.stringify(run),before);
});
test('the merge window and lifetime are anchored rather than extended by continuous hits',()=>{
 const run={},room={};advanceDamageNumbers(run,room,.01,[hit()]);advanceDamageNumbers(run,room,.1,[hit()]);
 assert.equal(damageNumberLabels(run)[0].amount,20);advanceDamageNumbers(run,room,.08,[hit()]);assert.equal(damageNumberLabels(run).length,2);
 for(let i=0;i<5;i++)advanceDamageNumbers(run,room,.1);
 assert.deepEqual(damageNumberLabels(run).map(f=>f.amount),[10]);
 advanceDamageNumbers(run,room,.1);advanceDamageNumbers(run,room,.1);assert.deepEqual(damageNumberLabels(run),[]);
});
test('bounded display budgets favor critical damage and return independent render snapshots',()=>{
 const run={},room={};advanceDamageNumbers(run,room,.01,Array.from({length:40},(_,id)=>hit({enemyId:id,critical:!!(id%2),criticalDamage:id%2?10:0})));
 assert.equal(damageNumberLabels(run).length,8);assert.equal(damageNumberLabels(run,{compact:true}).length,5);assert.equal(damageNumberLabels(run,{reduced:true}).length,4);
 assert.ok(damageNumberLabels(run).every(f=>f.critical));const first=damageNumberLabels(run);first[0].amount=999;
 assert.equal(damageNumberLabels(run)[0].amount,10);
});
test('room checks, room changes and load reset discard stale numbers',()=>{
 const run={},room={},other={};advanceDamageNumbers(run,room,.01,[hit()]);assert.deepEqual(damageNumberLabels(run,{room:other}),[]);
 advanceDamageNumbers(run,other,.01,[]);assert.deepEqual(damageNumberLabels(run),[]);
 advanceDamageNumbers(run,other,.01,[hit()]);resetDamageNumbers(run);assert.deepEqual(damageNumberLabels(run),[]);
});
test('only redundant generic critical words are replaced while pickups, hurt and weakness labels survive',()=>{
 const effects=Object.freeze([Object.freeze({criticalBurst:true,enemyId:1,text:'치명!'}),Object.freeze({criticalBurst:true,enemyId:2,text:'치명!'}),Object.freeze({criticalBurst:true,precisionBurst:true,enemyId:1,text:'약점 치명!'}),Object.freeze({essencePickup:true,text:'정수'}),Object.freeze({hitSource:'적',text:'-1 ♥'})]);
 const before=JSON.stringify(effects),n={critical:true,damageNumber:true,enemyId:1,text:'10!'};
 assert.deepEqual(combatLabelsWithDamage(effects,[n]),[...effects.slice(1),n]);assert.equal(JSON.stringify(effects),before);
});
test('roundoff creates no phantom normal damage and labels use actual capped damage, not overkill',()=>{
 const run={},room={};advanceDamageNumbers(run,room,.01,[hit({damage:1,critical:true,criticalDamage:1-Number.EPSILON})]);
 assert.equal(damageNumberLabels(run).length,1);assert.equal(damageNumberLabels(run)[0].amount,1);
 resetDamageNumbers(run);advanceDamageNumbers(run,room,.01,[hit({damage:5,before:5,after:-100})]);assert.equal(damageNumberLabels(run)[0].text,'5');
 assert.equal(formatDamageNumber(.01),'<0.1');assert.equal(formatDamageNumber(1.24),'1.2');assert.equal(formatDamageNumber(12345),'12.3K');assert.equal(formatDamageNumber(1234567),'1.2M');
});
