import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom,bossDefeated,travel} from '../../src/game/engine.js';
import {challengeDemon,advanceDemonPhase,updateDemon} from '../../src/combat/demon.js';
import {challengeKing,tickUpperState} from '../../src/combat/upper-floors.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
import {finalBossDefeated} from '../../src/game/boss-layout.js';
import {clearKingResurrection,tickKingResurrection,kingResurrectionAge} from '../../src/rendering/king-resurrection.js';
import {revivedKing} from '../../src/rendering/resurrected-king.js';

const run=campaign=>newRun(77,{campaign,bossLayoutVersion:1});
function arena(s,floor){s.floor=floor;s.room=s.floors[floor].findIndex(r=>r.type==='boss');return currentRoom(s);}
test('both new campaigns fight remnant on eight; legacy save keeps king and final demon',()=>{
 for(const campaign of ['classic','expanded']){
  const s=run(campaign),r=arena(s,7);assert.equal(r.kingPending,undefined);assert.ok(r.demonPending);assert.ok(challengeDemon(s));
  assert.equal(r.demon.pressureVersion,undefined);assert.ok(r.enemies.every(e=>e.remnantVersion===1&&e.tier===7));
  const restored=parseSave(encodeSave(s));assert.equal(restored.bossLayoutVersion,1);assert.equal(currentRoom(restored).demon.remnantVersion,1);
 }
 const old=newRun(77,{campaign:'expanded'});assert.equal(old.bossLayoutVersion,undefined);assert.ok(arena(old,7).kingPending);assert.ok(challengeKing(old));
 const restored=parseSave(encodeSave(old));assert.ok(restored.floors[9][1].demonPending);assert.equal(restored.bossLayoutVersion,undefined);
});
test('all remnant phases save; classic final key and expanded stairs retain distinct endings',()=>{
 for(const campaign of ['classic','expanded']){
  const s=run(campaign),r=arena(s,7);challengeDemon(s);
  for(let phase=1;phase<=3;phase++){
   assert.equal(r.demon.phase,phase);assert.doesNotThrow(()=>encodeSave(s));r.enemies=[];
   assert.equal(advanceDemonPhase(r,s.projectiles),phase<3);
  }
  assert.equal(bossDefeated(s),campaign==='classic'?'key':'stairs');assert.equal(s.key,campaign==='classic');
  if(campaign==='expanded'){assert.ok(travel(s,1));assert.equal(s.floor,8);assert.equal(s.key,false);}
 }
});
test('remnant has one attack stream and lower direct damage without pressure summons',()=>{
 const s=run('classic'),r=arena(s,7);challengeDemon(s);const mouth={id:0,type:'boss',variant:'demon',part:'mouth',remnantVersion:1,x:480,y:270,hp:900,max:900};r.enemies=[mouth];r.demon.phase=2;
 const p={x:530,y:270};r.demon.recovery=0;r.demon.attack={kind:'mouthTongue',owner:'mouth',time:.01,x:480,y:270,tx:530,ty:270,aim:0};const hits=[];
 updateDemon(s,r,p,.02,[],n=>hits.push(n));assert.deepEqual(hits,[6]);assert.equal(r.demon.attacks,undefined);assert.equal(r.demon.fields,undefined);
});
test('new final king stays on ten, saves phase three, and final ranking gate follows king',()=>{
 const s=run('expanded'),r=arena(s,9);assert.equal(r.demonPending,undefined);assert.ok(challengeKing(s));const e=r.enemies[0];assert.equal(e.resurrectionVersion,1);assert.equal(e.max,16000);assert.equal(e.tier,9);
 e.hp=e.max*.29;assert.equal(revivedKing(e),false);tickUpperState(e,s.player,r,.01,s.projectiles,()=>{});assert.equal(e.kingStage,3);assert.ok(revivedKing(e));assert.ok(e.kingTransition>0);assert.doesNotThrow(()=>encodeSave(s));
 r.enemies=[];assert.equal(bossDefeated(s),'key');assert.ok(finalBossDefeated(s));assert.ok(s.key);
});
test('resurrection cues fire once on a real phase transition, pause does not advance, reload never replays',()=>{
 clearKingResurrection();const e={variant:'king',resurrectionVersion:1,hp:100,max:100,kingStage:1};tickKingResurrection([e],0);e.hp=29;e.kingStage=3;e.kingTransition=1.4;
 assert.deepEqual(tickKingResurrection([e],.01),['kingResurrection']);assert.equal(kingResurrectionAge(e),0);assert.deepEqual(tickKingResurrection([e],0),[]);assert.equal(kingResurrectionAge(e),0);
 assert.deepEqual(tickKingResurrection([e],.56),['kingResurrectionBell']);assert.deepEqual(tickKingResurrection([e],.1),[]);
 clearKingResurrection();assert.deepEqual(tickKingResurrection([e],.1),[]);assert.equal(kingResurrectionAge(e),null);
 e.hp=0;assert.deepEqual(tickKingResurrection([e],.1),[]);assert.equal(kingResurrectionAge(e),null);
});
test('save validation rejects mismatched new boss layout and misplaced appearance flags',()=>{
 const s=run('expanded');delete s.floors[7].find(r=>r.type==='boss').demonPending;assert.throws(()=>encodeSave(s));
 const other=run('expanded'),r=arena(other,7);challengeDemon(other);r.enemies[0].resurrectionVersion=1;assert.throws(()=>encodeSave(other));
});
