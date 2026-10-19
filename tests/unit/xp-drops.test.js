import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom} from '../../src/game/engine.js';
import {stepRun,enterRoom} from '../../src/game/simulation.js';
import {dropXp,collectXp,XP_TIER_LIMIT} from '../../src/progression/xp-drops.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
function setup(){const s=newRun(31);s.tutorialComplete=true;s.attack=999;s.invulnerable=999;const r=currentRoom(s);r.enemies=[];r.obstacles=[];s.player.x=150;s.player.y=300;return {s,r};}
const remaining=r=>(r.xpDrops||[]).reduce((n,d)=>n+d.value,0);
test('kill creates 1/3/9 valued shards instead of granting XP, collecting grants exactly once',()=>{
 const {s,r}=setup();r.enemies=[{id:0,type:'chaser',x:700,y:270,hp:0,max:100,xpReward:13}];stepRun(s,.01);assert.equal(s.player.xp,0);assert.equal(remaining(r),13);assert.deepEqual(r.xpDrops.map(d=>d.tier),[9,3,1]);
 // Rendering/scatter never uses the run RNG; direct module drops are deterministic.
 const {s:a,r:b}=setup(),saved=a.randomState;dropXp(a,b,{x:700,y:270},13);assert.equal(a.randomState,saved);
 s.elapsed+=.2;for(const d of [...r.xpDrops]){s.player.x=d.x;s.player.y=d.y;collectXp(s,r,.1);}assert.equal(s.player.xp,13);assert.equal(remaining(r),0);assert.equal(collectXp(s,r,.1),0);assert.equal(s.player.xp,13);
});
test('shared magnet extends 30px to 100px, walls block attraction and collection',()=>{
 for(const magnet of [false,true]){const {s,r}=setup();s.player.x=400;s.player.y=270;if(magnet)s.player.relics=['magnet'];dropXp(s,r,{x:480,y:270},1);s.elapsed=.2;const d=r.xpDrops[0];d.x=480;d.y=270;collectXp(s,r,.01);assert.equal(d.attract,magnet);}
 const {s,r}=setup();s.player.x=400;s.player.y=270;s.player.relics=['magnet'];dropXp(s,r,{x:480,y:270},9);const d=r.xpDrops[0];d.x=480;d.y=270;r.obstacles=[{x:430,y:200,w:20,h:140,type:'wall'}];s.elapsed=.2;assert.equal(collectXp(s,r,1),0);assert.equal(d.x,480);assert.equal(d.attract,false);assert.equal(s.player.xp,0);
});
test('unclaimed XP survives leave/reload with no expiration or automatic award',()=>{
 const {s,r}=setup();dropXp(s,r,{x:700,y:270},45);s.elapsed=100;s.room=1;enterRoom(s);assert.equal(s.player.xp,0);const restored=parseSave(encodeSave(s)),old=restored.floors[0][0];assert.equal(remaining(old),45);restored.room=0;enterRoom(restored);assert.equal(remaining(old),45);assert.equal(restored.player.xp,0);
});
test('per-tier cap bundles value without losing XP or consuming RNG',()=>{
 const {s,r}=setup(),random=s.randomState;dropXp(s,r,{x:700,y:270},9000);dropXp(s,r,{x:700,y:270},3000);dropXp(s,r,{x:700,y:270},1001);assert.ok(r.xpDrops.length<=XP_TIER_LIMIT*3);assert.equal(remaining(r),13001);assert.equal(r.xpDroppedTotal,13001);assert.equal(s.randomState,random);assert.doesNotThrow(()=>encodeSave(s));
});
test('save rejects duplicated drops, altered values, invalid tiers and missing ledger',()=>{
 for(const corrupt of [r=>r.xpDrops.push({...r.xpDrops[0]}),r=>r.xpDrops[0].value++,r=>r.xpDrops[0].tier=2,r=>delete r.xpCollectedTotal]){const {s,r}=setup();dropXp(s,r,{x:700,y:270},12);corrupt(r);assert.throws(()=>encodeSave(s));}
});
test('summons and descent kills create no new experience shards',()=>{
 for(const returning of [false,true]){const {s,r}=setup();s.key=returning;r.enemies=[{id:0,type:'chaser',x:700,y:270,hp:0,max:100,...(!returning?{summoned:true}: {})}];stepRun(s,.01);assert.equal(remaining(r),0);assert.equal(s.player.xp,0);}
});
test('normal boss completion drops exactly 45 once, not on every following tick',()=>{
 const {s}=setup();s.floor=1;s.room=s.floors[1].findIndex(r=>r.type==='boss');const r=currentRoom(s);r.obstacles=[];r.enemies=[{id:0,type:'boss',x:700,y:270,hp:0,max:100,variant:'warden'}];s.player.x=150;s.player.y=300;stepRun(s,.01);assert.equal(remaining(r),45);assert.equal(s.player.xp,0);assert.equal(r.used,true);stepRun(s,.01);assert.equal(remaining(r),45);
});
