import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom,travel} from '../../src/game/engine.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
import {fountainPoint,useFountain} from '../../src/world/fountain.js';
import {challengeCommander} from '../../src/combat/commander.js';

test('explicit expanded draft adds connected ninth and two-room final floors without changing classic',()=>{
 const classic=newRun(93),draft=newRun(93,{campaign:'expanded'});
 assert.equal(classic.floors.length,8);
 assert.equal(classic.campaign,undefined);
 assert.equal(classic.ranking.seasonId,'BETA-1');
 assert.equal(draft.floors.length,10);
 assert.equal(draft.ranking.seasonId,'ASCENT-1');
 assert.equal(draft.ranking.rulesVersion,'ranking-v2');
 assert.deepEqual(draft.floors.slice(0,8),classic.floors);
 const ninth=draft.floors[8],commander=ninth.find(r=>r.type==='boss'),stairs=ninth.find(r=>r.type==='up');
 assert.ok(commander?.commanderPending);
 assert.deepEqual(commander.enemies,[]);
 assert.equal(Math.abs(commander.x-stairs.x)+Math.abs(commander.y-stairs.y),1);
 const [entry,final]=draft.floors[9];
 assert.deepEqual([entry.type,entry.x,entry.y,entry.fountainReady],['down',0,0,true]);
 assert.deepEqual([final.type,final.x,final.y,final.demonPending],['boss',1,0,true]);
 assert.deepEqual(entry.enemies,[]);
 assert.deepEqual(final.enemies,[]);
 assert.equal(Math.abs(entry.x-final.x)+Math.abs(entry.y-final.y),1);
});

test('expanded draft saves its topology and permits ascent and descent without entering BETA-1',()=>{
 const draft=newRun(4,{campaign:'expanded'});
 draft.floor=7;draft.room=draft.floors[7].findIndex(r=>r.type==='boss');currentRoom(draft).used=true;
 assert.equal(travel(draft,1),true);assert.equal(draft.floor,8);
 const ninthStairs=draft.floors[8].findIndex(r=>r.type==='up');draft.floors[8][ninthStairs].enemies=[];draft.room=ninthStairs;assert.equal(travel(draft,1),false);
 draft.room=draft.floors[8].findIndex(r=>r.type==='boss');assert.equal(challengeCommander(draft),true);currentRoom(draft).enemies=[];currentRoom(draft).used=true;
 assert.equal(travel(draft,1),true);assert.equal(draft.floor,9);assert.equal(draft.room,0);
 assert.equal(travel(draft,-1),true);assert.equal(draft.floor,8);assert.equal(currentRoom(draft).type,'boss');
 draft.room=ninthStairs;assert.equal(travel(draft,1),true);assert.equal(draft.floor,9);
 assert.deepEqual(fountainPoint(currentRoom(draft)),{x:680,y:270});
 draft.player.hp=2;assert.equal(useFountain(draft),true);assert.equal(draft.player.hp,5);assert.equal(currentRoom(draft).fountainReady,false);assert.equal(currentRoom(draft).used,false);assert.equal(useFountain(draft),false);
 assert.equal(travel(draft,-1),true);assert.equal(draft.floor,8);assert.equal(currentRoom(draft).type,'boss');
 const restored=parseSave(encodeSave(draft));
 assert.equal(restored.campaign,'expanded');assert.equal(restored.ranking.seasonId,'ASCENT-1');
 assert.equal(restored.floors[9][0].fountainReady,false);
 for(const change of [s=>{s.floors[9].push({...s.floors[9][1],x:2});},s=>{delete s.floors[9][0].fountainReady;},s=>{s.ranking=newRun(4).ranking;},s=>{delete s.campaign;}]){
  const copy=structuredClone(restored);change(copy);assert.throws(()=>encodeSave(copy));
 }
 const older=structuredClone(restored);delete older.ranking;assert.equal(parseSave(encodeSave(older)).ranking,undefined);
});
