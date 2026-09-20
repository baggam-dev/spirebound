import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom} from './engine.js';
import {stepRun,enterRoom} from './simulation.js';
import {hitEnemy} from './progression.js';
import {frostShatter,auraProfile,skillGrade} from './skill-tree.js';
import {chargeProfile,attackProfile} from './balance.js';
import {encodeSave,parseSave} from './storage.js';
const enemy=(id,x=600,hp=100)=>({id,x,y:300,type:'archer',hp,max:100,cd:999,balanceVersion:1});
test('frozen death emits six distinct radial shards exactly once, with level-scaled damage',()=>{
 const p={frost:2},e={x:500,y:300,hp:0,frozen:1},b=[];assert.ok(frostShatter(p,e,b));assert.equal(b.length,6);assert.equal(new Set(b.map(b=>Math.atan2(b.vy,b.vx).toFixed(4))).size,6);assert.ok(b.every(b=>Math.abs(b.damageScale-.4)<1e-9&&!b.homing&&b.pierce===0));assert.equal(frostShatter(p,e,b),false);assert.equal(b.length,6);
});
test('a lethal frost hit applies its stack and can freeze before shattering',()=>{
 const e=enemy(0,600,1);e.frostStacks=2;hitEnemy({damage:20,frost:3},e,[e]);assert.ok(e.frozen);assert.equal(frostShatter({frost:3},e,[]),true);
});
test('frozen shard victims chain without exponential damage and grant one kill each',()=>{
 const s=newRun(1),r=currentRoom(s);s.player.frost=2;s.player.damage=30;s.attack=999;r.obstacles=[];const a=enemy(0,550,0),b=enemy(1,610,5);a.frozen=1;b.frozen=1;r.enemies=[a,b];stepRun(s,.01);assert.equal(s.projectiles.length,6);assert.equal(s.kills,1);stepRun(s,.2);assert.equal(s.kills,2);assert.ok(s.projectiles.length>=6);assert.ok(s.projectiles.every(b=>Math.abs(b.damageScale-.4)<1e-9));stepRun(s,.1);assert.equal(s.kills,2);
});
test('shards at all levels add frost stacks and scale direct damage',()=>{
 for(const level of [2,3]){const s=newRun(2),r=currentRoom(s);s.player.frost=level;s.player.damage=30;s.attack=999;r.enemies=[enemy(1,610)];frostShatter(s.player,{x:550,y:300,hp:0,frozen:1},s.projectiles);stepRun(s,.2);assert.ok(Math.abs(r.enemies[0].hp-(100-30*.92*(.3+.05*level)))<1e-8);assert.equal(r.enemies[0].frostStacks,1);}
});
test('aura deaths preserve frozen state even when the frame expires its timer',()=>{
 const s=newRun(4),r=currentRoom(s);s.player.frost=1;s.player.aura=3;s.attack=999;const e=enemy(0,520,1);e.frozen=.01;r.enemies=[e];stepRun(s,.1);assert.equal(s.kills,1);assert.equal(s.projectiles.length,6);
});
test('shards resume identically across saves and disappear on room entry',()=>{
 const s=newRun(2);s.player.frost=3;s.attack=999;frostShatter(s.player,{x:550,y:300,hp:0,frozen:1},s.projectiles);const t=parseSave(encodeSave(s));stepRun(s,.1);stepRun(t,.1);assert.deepEqual(s.projectiles,t.projectiles);enterRoom(t);assert.equal(t.projectiles.length,0);
});
test('aura radius and DPS grow each level, and trial charge pressure exceeds ordinary enemies',()=>{
 assert.deepEqual([1,2,3].map(auraProfile),[{radius:90,dps:24},{radius:115,dps:48},{radius:140,dps:72}]);const a=chargeProfile({}),b=chargeProfile({trialChampion:true});assert.ok(b.speed>a.speed&&b.speed*b.duration>a.speed*a.duration);assert.ok(b.warning>=.25);assert.ok(attackProfile({trialChampion:true}).recovery<attackProfile({}).recovery);
});
test('tiers distinguish main, rare and unique while ordinary supports remain normal',()=>{
 assert.equal(skillGrade('fire'),'main');assert.equal(skillGrade('split'),'rare');assert.equal(skillGrade('repeat'),'rare');assert.equal(skillGrade('homing'),'unique');assert.equal(skillGrade('aura'),'normal');
});
