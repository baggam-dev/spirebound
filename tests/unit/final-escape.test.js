import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom,canEscape,roomLocked} from '../../src/game/engine.js';
import {startFinalEscape,tickFinalEscape,FINAL_ESCAPE_DURATION,FINAL_ESCAPE_CAP} from '../../src/world/final-escape.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
import {finishRanking} from '../../src/ranking/ranking.js';

test('final seal needs the key, takes three timed waves and survives reload',()=>{
 const run=newRun(47),room=currentRoom(run);run.generationVersion=33;
 assert.equal(startFinalEscape(run,room),false);
 run.key=true;assert.equal(canEscape(run),false);
 assert.equal(startFinalEscape(run,room),true);
 assert.equal(startFinalEscape(run,room),false);
 assert.equal(roomLocked(run),true);
 assert.equal(room.enemies.length,4);
 tickFinalEscape(run,room,11.9);assert.equal(room.enemies.length,4);
 const resumed=parseSave(encodeSave(run)),exit=currentRoom(resumed);
 assert.equal(exit.finalEscape.wave,1);
 assert.deepEqual(tickFinalEscape(resumed,exit,.1),['finalWave']);
 assert.equal(exit.enemies.length,9);
 tickFinalEscape(resumed,exit,12);assert.equal(exit.enemies.length,15);
 assert.equal(new Set(exit.enemies.map(e=>e.id)).size,15);
 assert.deepEqual(tickFinalEscape(resumed,exit,12),['finalReady']);
 assert.equal(exit.finalEscape.elapsed,FINAL_ESCAPE_DURATION);
 assert.equal(exit.enemies.length,0);
 assert.equal(roomLocked(resumed),false);
 assert.equal(canEscape(resumed),true);
 assert.equal(parseSave(encodeSave(resumed)).floors[0][0].finalEscape.ready,true);
});

test('new season scores require the broken seal; previous saves keep their old exit',()=>{
 const run=newRun(48);run.key=true;run.status='won';
 assert.equal(finishRanking(run),null);
 run.floors[0][0].finalEscape={elapsed:36,wave:3,ready:true};
 assert.ok(finishRanking(run));
 const old=newRun(49);old.generationVersion=27;old.key=true;old.ranking.seasonId='BETA-3';old.ranking.rulesVersion='ranking-v7';
 assert.equal(canEscape(old),true);
 assert.equal(parseSave(encodeSave(old)).ranking.seasonId,'BETA-3');
});

test('malformed seal progress is rejected rather than loading an invalid victory',()=>{
 const run=newRun(50);run.key=true;run.floors[0][0].finalEscape={elapsed:36,wave:3,ready:true};
 for(const change of [state=>state.elapsed=40,state=>state.wave=4,state=>state.ready='yes']){
  const copy=structuredClone(run);change(copy.floors[0][0].finalEscape);assert.throws(()=>encodeSave(copy));
 }
});

test('new escape warns nine waves and increases total summons from fifteen to fifty-four',()=>{
 const run=newRun(71),room=currentRoom(run);run.key=true;assert.ok(startFinalEscape(run,room));assert.equal(room.enemies.length,0);assert.equal(room.finalEscape.pending.length,4);let total=0;
 for(let wave=0;wave<9;wave++){
  if(wave)tickFinalEscape(run,room,3.15);
  const expected=[4,4,5,5,6,6,7,8,9][wave];assert.equal(room.finalEscape.wave,wave+1);assert.equal(room.finalEscape.pending.length,expected);
  const saved=parseSave(encodeSave(run));assert.deepEqual(saved.floors[0][0].finalEscape,room.finalEscape);
  tickFinalEscape(run,room,.85);assert.equal(room.enemies.length,expected);total+=expected;assert.ok(room.enemies.every(e=>e.summoned&&e.spawnGrace===.7));room.enemies=[];
 }
 assert.equal(total,54);assert.ok(roomLocked(run));assert.equal(canEscape(run),false);assert.ok(tickFinalEscape(run,room,3.15).includes('finalReady'));assert.equal(canEscape(run),true);assert.equal(room.finalEscape.pending.length,0);assert.ok(parseSave(encodeSave(run)));
});
test('pressure remains capped with live enemies and ids never collide',()=>{
 const run=newRun(72),room=currentRoom(run);run.key=true;startFinalEscape(run,room);
 for(let i=0;i<359;i++){tickFinalEscape(run,room,.1);room.enemies.forEach((e,j)=>{e.x=350+j*8;e.y=250;});assert.ok(room.enemies.filter(e=>e.hp>0).length+room.finalEscape.pending.length<=FINAL_ESCAPE_CAP);assert.equal(new Set(room.enemies.map(e=>e.id)).size,room.enemies.length);}
 assert.equal(room.enemies.length,24);run.projectiles=[{x:1}];tickFinalEscape(run,room,.2);assert.equal(room.enemies.length,0);assert.equal(run.projectiles.length,0);assert.equal(room.finalEscape.wave,9);
});
test('portal avoids players, blocked points, and cancels when player enters warning',()=>{
 const run=newRun(73),room=currentRoom(run);run.key=true;run.player.x=100;run.player.y=110;room.obstacles=[{x:835,y:145,w:50,h:50,type:'wall'}];startFinalEscape(run,room);
 assert.ok(room.finalEscape.pending.every(p=>Math.hypot(p.x-run.player.x,p.y-run.player.y)>=160));assert.ok(!room.finalEscape.pending.some(p=>p.x===860&&p.y===170));
 const point=room.finalEscape.pending[0];run.player.x=point.x;run.player.y=point.y;tickFinalEscape(run,room,.85);assert.ok(room.enemies.every(e=>Math.hypot(e.x-run.player.x,e.y-run.player.y)>=80));
});
test('pressure continuation never duplicates warned or spawned enemies',()=>{
 const run=newRun(74),room=currentRoom(run);run.key=true;startFinalEscape(run,room);tickFinalEscape(run,room,.4);
 const loaded=parseSave(encodeSave(run)),r=currentRoom(loaded);tickFinalEscape(loaded,r,.46);assert.equal(r.enemies.length,4);assert.equal(r.finalEscape.pending.length,0);const ids=r.enemies.map(e=>e.id);startFinalEscape(loaded,r);tickFinalEscape(loaded,r,.1);assert.deepEqual(r.enemies.map(e=>e.id),ids);assert.ok(parseSave(encodeSave(loaded)));
});
test('summoned pressure enemies cannot farm xp, kills or ranked kills',async()=>{
 const {stepRun}=await import('../../src/game/simulation.js');const run=newRun(75),room=currentRoom(run);run.key=true;run.tutorialComplete=true;run.player.mainSkill='precision';run.player.precision=1;run.invulnerable=999;run.attack=999;startFinalEscape(run,room);tickFinalEscape(run,room,.85);room.enemies.forEach(e=>e.hp=0);const xp=run.player.xp,kills=run.kills,rank=run.ranking.defeated.length;stepRun(run,.001);assert.equal(run.player.xp,xp);assert.equal(run.kills,kills);assert.equal(run.ranking.defeated.length,rank);
});
test('invalid pressure metadata is rejected and old ascent still starts legacy waves',()=>{
 const run=newRun(76);run.key=true;startFinalEscape(run,currentRoom(run));
 for(const mutate of [s=>s.generationVersion=33,s=>s.floors[0][0].finalEscape.pressureVersion=2,s=>s.floors[0][0].finalEscape.pending[0].at=5,s=>s.floors[0][0].finalEscape.pending[0].type='boss']){const s=structuredClone(run);mutate(s);assert.throws(()=>encodeSave(s));}
 const old=newRun(76);old.generationVersion=33;old.key=true;startFinalEscape(old,currentRoom(old));assert.equal(currentRoom(old).finalEscape.pressureVersion,undefined);assert.equal(currentRoom(old).enemies.length,4);assert.ok(parseSave(encodeSave(old)));
});
