import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom,canEscape,roomLocked} from '../../src/game/engine.js';
import {startFinalEscape,tickFinalEscape,FINAL_ESCAPE_DURATION} from '../../src/world/final-escape.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
import {finishRanking} from '../../src/ranking/ranking.js';

test('final seal needs the key, takes three timed waves and survives reload',()=>{
 const run=newRun(47),room=currentRoom(run);
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
