import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom} from '../../src/game/engine.js';
import {stepRun,enterRoom} from '../../src/game/simulation.js';
import {dropXp,collectXp,XP_TIER_LIMIT} from '../../src/progression/xp-drops.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
import {blocked,segmentBlocked} from '../../src/world/terrain.js';
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

test('elite and boss presentation split existing XP while preserving value, RNG and bounds',()=>{
 for(const kind of ['elite','boss'])for(const amount of [1,2,3,8,9,12,13,41,45,13001]){
  const {s,r}=setup(),random=s.randomState;dropXp(s,r,{x:700,y:270},amount,kind);
  assert.equal(remaining(r),amount);assert.equal(r.xpDroppedTotal,amount);assert.equal(s.player.xp,0);assert.equal(s.randomState,random);
  assert.ok(r.xpDrops.length<=192);assert.ok(r.xpDrops.every(d=>d.burst===kind&&d.burstOrder>=0&&d.burstOrder<192));
  assert.equal(parseSave(encodeSave(s)).floors[0][0].xpDroppedTotal,amount);
 }
 const {s,r}=setup();dropXp(s,r,{x:700,y:270},45,'boss');assert.deepEqual(r.xpDrops.map(d=>d.tier),[9,9,9,9,3,3,1,1,1]);
 const {s:a,r:b}=setup();dropXp(a,b,{x:700,y:270,elite:'guardian'},12);assert.deepEqual(b.xpDrops.map(d=>d.tier),[9,1,1,1]);
});

test('burst metadata roundtrips, legacy drops still load, malformed profiles are refused',()=>{
 const {s,r}=setup();dropXp(s,r,{x:700,y:270},45,'boss');const copy=parseSave(encodeSave(s));assert.deepEqual(copy.floors[0][0].xpDrops,r.xpDrops);
 for(const d of r.xpDrops){delete d.burst;delete d.burstOrder;}assert.doesNotThrow(()=>encodeSave(s));
 for(const corrupt of [d=>d.burst='other',d=>d.burstOrder=192,d=>delete d.burstOrder,d=>{delete d.burst;d.burstOrder=0;}]){
  const {s:a,r:b}=setup();dropXp(a,b,{x:700,y:270},45,'boss');corrupt(b.xpDrops[0]);assert.throws(()=>encodeSave(a));
 }
});

test('broader burst respects walls, retains .18s pickup and bundles without replay events',()=>{
 const {s,r}=setup(),origin={x:700,y:270};r.obstacles=[{x:710,y:200,w:20,h:180,type:'wall'}];dropXp(s,r,origin,45,'boss');
 for(const d of r.xpDrops){assert.equal(blocked(d.x,d.y,6,r.obstacles),false);assert.equal(segmentBlocked(origin,d,r.obstacles,6),false);}
 s.player.x=r.xpDrops[0].x;s.player.y=r.xpDrops[0].y;s.elapsed=.179;assert.equal(collectXp(s,r,1),0);s.elapsed=.18;assert.ok(collectXp(s,r,1)>0);
 const {s:a,r:b}=setup();for(const tier of [9,3,1])for(let i=0;i<64;i++)dropXp(a,b,origin,tier);dropXp(a,b,origin,9000);const random=a.randomState;
 assert.equal(dropXp(a,b,origin,45,'boss'),undefined);assert.equal(remaining(b),64*13+9000+45);assert.equal(a.randomState,random);assert.doesNotThrow(()=>encodeSave(a));
});

test('explosive elite emits reward once without removing its delayed danger',()=>{
 const {s,r}=setup();r.enemies=[{id:0,type:'chaser',x:700,y:270,hp:0,max:100,elite:'explosive',xpReward:12}];
 const result=stepRun(s,.01);assert.equal(result.events.filter(e=>e==='xpElite').length,1);assert.equal(remaining(r),12);assert.ok(r.blasts.some(b=>b.time>0));
 assert.equal(stepRun(s,.01).events.includes('xpElite'),false);
});
