import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom} from '../../src/game/engine.js';
import {stepRun} from '../../src/game/simulation.js';
import {dropXp,collectXp} from '../../src/progression/xp-drops.js';
import {bossXpReward} from '../../src/progression/enemy-rewards.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
import {startBossClear,advanceBossClear,bossClearState,resetBossClear} from '../../src/rendering/boss-clear.js';
const value=r=>(r.xpDrops||[]).reduce((n,d)=>n+d.value,0);
function setup(){const s=newRun(31);s.attack=999;s.invulnerable=999;s.tutorialComplete=true;const r=currentRoom(s);r.enemies=[];r.obstacles=[];s.player.x=100;s.player.y=100;return {s,r};}

test('descent XP survives saving and collection exactly once without rewarding summons',()=>{
 let {s,r}=setup();s.key=true;r.enemies=[{id:0,type:'archer',hp:0,max:100,x:600,y:250,cd:999},{id:1,type:'chaser',hp:0,max:100,x:700,y:250,summoned:true}];
 stepRun(s,.01);assert.equal(value(r),12);s=parseSave(encodeSave(s));r=currentRoom(s);s.elapsed+=1;
 for(const d of [...r.xpDrops]){s.player.x=d.x;s.player.y=d.y;collectXp(s,r,.1);}assert.equal(value(r),0);assert.equal(s.player.xp,12);assert.equal(collectXp(s,r,1),0);
});

test('boss rewards conserve value with bounded scatter, delayed collection and legacy save fields',()=>{
 assert.deepEqual([1,3,5,7,8,9].map(bossXpReward),[180,240,300,360,420,480]);
 for(const amount of [180,240,300,360,420,480]){
  const {s,r}=setup(),origin={x:480,y:270},random=s.randomState;dropXp(s,r,origin,amount,'boss');assert.equal(value(r),amount);assert.ok(r.xpDrops.length<=64);assert.ok(r.xpDrops.some(d=>Math.hypot(d.x-origin.x,d.y-origin.y)>100));assert.equal(s.randomState,random);
  s.player.x=r.xpDrops[0].x;s.player.y=r.xpDrops[0].y;s.elapsed=.599;assert.equal(collectXp(s,r,1),0);assert.equal(value(r),amount);
  s.elapsed=.6;assert.ok(collectXp(s,r,.1)>0);assert.equal(value(r)+s.player.xp,amount);assert.equal(parseSave(encodeSave(s)).floors[0][0].xpDroppedTotal,amount);
 }
});

test('final boss reward is present once before descent and never reissued on a used room',()=>{
 const s=newRun(31);s.floor=s.floors.length-1;s.room=s.floors[s.floor].findIndex(r=>r.type==='boss');const r=currentRoom(s);r.obstacles=[];s.attack=999;s.invulnerable=999;s.player.x=100;s.player.y=100;r.enemies=[{id:0,type:'boss',variant:'king',hp:0,max:100,x:600,y:250}];
 const result=stepRun(s,.01);assert.ok(result.events.includes('key'));assert.equal(value(r),360);assert.equal(s.key,true);assert.equal(r.used,true);stepRun(s,.01);assert.equal(value(r),360);assert.equal(parseSave(encodeSave(s)).floors[s.floor][s.room].xpDroppedTotal,360);
});

test('boss clear cannot replay on the same room, freezes on pause and resets on room change/load',()=>{
 const run={},room={};assert.equal(startBossClear(run,room,{x:400,y:200}),true);assert.equal(startBossClear(run,room,{x:900,y:400}),false);
 advanceBossClear(run,room,.05,false);assert.equal(bossClearState(run).age,0);advanceBossClear(run,room,.05,true);assert.equal(bossClearState(run).age,.05);
 advanceBossClear(run,{},.05,true);assert.equal(bossClearState(run),null);startBossClear(run,room);resetBossClear(run);assert.equal(bossClearState(run),null);
});
