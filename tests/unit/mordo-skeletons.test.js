// Prepared for the next explicit deployment verification; not run during implementation.
import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom} from '../../src/game/engine.js';
import {challengeKing} from '../../src/combat/upper-floors.js';
import {strengthenKing} from '../../src/combat/balance.js';
import {shadowBoss} from '../../src/world/shadow-escape.js';
import {tickKingSkeletonSummons,cleanupKingSkeletons} from '../../src/combat/mordo-summons.js';
import {updateSkeleton} from '../../src/combat/skeleton-enemies.js';
import {isSkeleton,skeletonWave} from '../../src/combat/skeleton-profile.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
function arena(phase=1){const s=newRun(85,{campaign:'expanded',bossLayoutVersion:1});s.floor=9;s.room=s.floors[9].findIndex(r=>r.type==='boss');challengeKing(s);const r=currentRoom(s),e=r.enemies[0];r.obstacles=[];s.player.x=480;s.player.y=430;e.hp=e.max*(phase===1?1:phase===2?.5:.2);e.kingStage=phase;s.entryGrace=0;return {s,r,e};}
function wave(a,phase,random=()=>.1){tickKingSkeletonSummons(a.e,a.s.player,a.r,skeletonWave(phase).interval-.8,phase,random);assert.ok(a.e.skeletonPortals);tickKingSkeletonSummons(a.e,a.s.player,a.r,.8,phase,random);}
test('every phase summons exact warrior/archer composition with exactly one elite',()=>{
 for(const phase of [1,2,3]){const a=arena(phase);wave(a,phase);const children=a.r.enemies.filter(isSkeleton);assert.equal(children.length,[0,1,2,4][phase]);assert.equal(children.filter(e=>e.elite).length,1);assert.ok(children.every(e=>e.summoned&&e.summoner===a.e.id));if(phase>1){assert.equal(children.filter(e=>e.type==='skeletonWarrior').length,phase===2?1:2);assert.equal(children.filter(e=>e.type==='skeletonArcher').length,phase===2?1:2);}assert.doesNotThrow(()=>parseSave(encodeSave(a.s)));}
 const a=arena();wave(a,1,()=>.9);assert.equal(a.r.enemies.find(isSkeleton).type,'skeletonArcher');
});
test('phase-three living and elite caps skip waves rather than retaining a burst backlog',()=>{
 const a=arena(3);for(let i=0;i<3;i++)wave(a,3);assert.equal(a.r.enemies.filter(isSkeleton).length,12);assert.equal(a.r.enemies.filter(e=>isSkeleton(e)&&e.elite).length,3);
 for(let i=0;i<100;i++)tickKingSkeletonSummons(a.e,a.s.player,a.r,.1,3,()=>.1);
 assert.equal(a.r.enemies.filter(isSkeleton).length,12);assert.equal(a.e.skeletonPortals,undefined);
 a.r.enemies=a.r.enemies.filter(e=>e===a.e);tickKingSkeletonSummons(a.e,a.s.player,a.r,.01,3,()=>.1);assert.equal(a.r.enemies.length,1);
});
test('player entering an announced portal cancels the whole wave without a telefrag',()=>{
 const a=arena(3);tickKingSkeletonSummons(a.e,a.s.player,a.r,2.2,3,()=>.1);assert.equal(a.e.skeletonPortals.length,4);Object.assign(a.s.player,a.e.skeletonPortals[0]);tickKingSkeletonSummons(a.e,a.s.player,a.r,.8,3,()=>.1);assert.equal(a.r.enemies.length,1);assert.equal(a.e.skeletonPortals,undefined);
});
test('legacy Mordo health migrates once with injury preserved and old ranged summons removed',()=>{
 const a=arena();a.e.max=25600;a.e.hp=12800;delete a.e.kingSkeletonVersion;a.e.guardPortal={x:100,y:100,time:.7};a.r.enemies.push({id:1,type:'astralSniper',x:200,y:200,hp:180,max:180,tier:7,cd:1,balanceVersion:1,summoned:true,summoner:a.e.id});
 const loaded=parseSave(encodeSave(a.s)),e=currentRoom(loaded).enemies[0];assert.equal(e.max,21760);assert.equal(e.hp,10880);assert.equal(e.guardPortal,undefined);assert.equal(currentRoom(loaded).enemies.length,1);assert.equal(currentRoom(parseSave(encodeSave(loaded))).enemies[0].hp,10880);
});
test('shadow Mordo keeps its original health and never opens skeleton portals',()=>{
 const a=arena(),e=shadowBoss(a.s,'king',99,{x:200,y:200}),max=e.max;strengthenKing(e);assert.equal(e.max,max);tickKingSkeletonSummons(e,a.s.player,{obstacles:[],enemies:[e]},10,3,()=>.1);assert.equal(e.skeletonPortals,undefined);
});
test('owner death removes skeletons, their arrows and delayed elite explosions without rewards',()=>{
 const a=arena();wave(a,1);a.e.hp=0;a.r.blasts=[{x:200,y:200,r:85,time:.5,skeletonOwner:a.e.id}];const bullets=[{skeletonShot:true,skeletonOwner:a.e.id,life:2}];cleanupKingSkeletons(a.r,bullets);const child=a.r.enemies.find(isSkeleton);assert.equal(child.hp,0);assert.equal(child.skeletonCleanup,true);assert.equal(bullets[0].life,0);assert.deepEqual(a.r.blasts,[]);
});
test('archer patterns produce five fan arrows, one bouncing arrow and paced three-shot burst',()=>{
 for(const [value,kind,count] of [[.01,'fan',5],[.5,'ricochet',1],[.99,'burst',3]]){
  const a=arena(),e={id:1,type:'skeletonArcher',x:200,y:200,hp:650,max:650,cd:0,summoned:true,summoner:0,skeletonVersion:1},p={x:450,y:200},bullets=[];a.r.enemies.push(e);
  updateSkeleton(e,p,a.r,.01,bullets,()=>{},()=>value);assert.equal(e.skeletonAttack.kind,kind);assert.equal(bullets.length,0);updateSkeleton(e,p,a.r,.35,bullets,()=>{},()=>value);
  if(kind==='burst'){assert.equal(bullets.length,1);updateSkeleton(e,p,a.r,.12,bullets,()=>{},()=>value);assert.equal(bullets.length,2);updateSkeleton(e,p,a.r,.12,bullets,()=>{},()=>value);}
  assert.equal(bullets.length,count);assert.ok(bullets.every(b=>b.skeletonShot&&b.skeletonOwner===0));if(kind==='ricochet')assert.equal(bullets[0].bounces,1);
 }
});
test('warrior dash is locked in direction, stops at cover and cannot hurt through it',()=>{
 const a=arena(),e={id:1,type:'skeletonWarrior',x:200,y:200,hp:900,max:900,cd:0,summoned:true,summoner:0,skeletonVersion:1,skeletonDashClock:0},p={x:400,y:200};a.r.enemies.push(e);let hits=0;
 updateSkeleton(e,p,a.r,.01,[],()=>hits++,()=>.1);assert.equal(e.skeletonAttack.kind,'dash');updateSkeleton(e,p,a.r,.55,[],()=>hits++,()=>.1);assert.equal(e.skeletonAttack.stage,'active');a.r.obstacles=[{x:300,y:150,w:30,h:100}];updateSkeleton(e,p,a.r,.36,[],()=>hits++,()=>.1);assert.equal(hits,0);assert.ok(e.x>200&&e.x<=282);assert.equal(e.skeletonAttack.aim,0);
});
