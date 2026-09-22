import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom} from './engine.js';
import {stepRun} from './simulation.js';
import {createPractice} from './boss-practice.js';
import {enemyHitEffects,enemyDeathEffect,mergeEnemyFeedback} from './enemy-feedback.js';
function run(hp=100){const s=newRun(42);s.attack=100;s.player.damage=10;s.player.x=100;s.player.y=200;const r=currentRoom(s);r.obstacles=[];r.enemies=[{id:1,type:'archer',x:220,y:200,hp,max:100,cd:3}];s.projectiles=[{x:120,y:200,vx:1000,vy:0,life:1,enemy:false,pierce:0,hit:[]}];return s;}
test('actual damage emits a hit reaction without moving or stunning its target',()=>{
 const s=run(),e=currentRoom(s).enemies[0],result=stepRun(s,.1);assert.equal(e.hp,90);assert.equal(e.x,220);assert.equal(e.y,200);assert.equal(result.effects.filter(f=>f.enemyFeedback==='hit').length,1);
 const hp=new Map([[e,e.hp]]);assert.deepEqual(enemyHitEffects(hp,[e]),[]);e.hp++;assert.deepEqual(enemyHitEffects(hp,[e]),[]);
});
test('death feedback is emitted once while removal and rewards remain immediate',()=>{
 const s=run(1);const first=stepRun(s,.1);assert.equal(first.effects.filter(f=>f.enemyFeedback==='death').length,1);assert.equal(first.effects.filter(f=>f.enemyFeedback==='hit').length,0);assert.equal(currentRoom(s).enemies.length,0);assert.equal(s.kills,1);
 assert.equal(stepRun(s,.1).effects.filter(f=>f.enemyFeedback==='death').length,0);assert.equal(s.kills,1);
});
test('slime split stays distinct and surviving summons removed by boss cleanup do not fake deaths',()=>{
 const s=createPractice('slime','fire',42),r=currentRoom(s);s.attack=100;r.enemies[0].hp=0;const result=stepRun(s,0);const death=result.effects.find(f=>f.enemyFeedback==='death');assert.equal(death.style,'slime');assert.equal(death.split,true);assert.equal(r.enemies.filter(e=>e.type==='boss').length,2);
 const boss=createPractice('warden','fire',42),br=currentRoom(boss);boss.attack=100;br.enemies[0].hp=0;br.enemies.push({id:100,type:'archer',hp:100,max:100,x:600,y:100,cd:3,summoned:true});const fx=stepRun(boss,0).effects.filter(f=>f.enemyFeedback==='death');assert.equal(fx.length,1);assert.notEqual(fx[0].enemyId,100);
});
test('continuous damage is throttled, death cancels hit glints, and crowd caps keep other cues',()=>{
 const hit={enemyFeedback:'hit',enemyId:1,t:.2};assert.equal(mergeEnemyFeedback([hit],[{...hit}]).length,1);const death={enemyFeedback:'death',enemyId:1,t:.5};assert.deepEqual(mergeEnemyFeedback([hit],[death]),[death]);
 const text={text:'피격'},hits=Array.from({length:80},(_,i)=>({...hit,enemyId:i})),deaths=Array.from({length:40},(_,i)=>({...death,enemyId:100+i}));const merged=mergeEnemyFeedback([text],[...hits,...deaths]);assert.equal(merged.filter(f=>f.enemyFeedback==='hit').length,32);assert.equal(merged.filter(f=>f.enemyFeedback==='death').length,24);assert.equal(merged[0],text);
});
test('death snapshots have no live enemy references or state mutations',()=>{
 const e=Object.freeze({id:1,type:'boss',variant:'prism',x:400,y:200,hp:0});const before=JSON.stringify(e),f=enemyDeathEffect(e);assert.equal(f.style,'crystal');assert.equal(JSON.stringify(e),before);assert.equal(Object.values(f).some(v=>v&&typeof v==='object'),false);
});
