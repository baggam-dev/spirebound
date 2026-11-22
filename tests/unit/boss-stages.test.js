import {configureBossLayout} from '../../src/game/boss-layout.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom} from '../../src/game/engine.js';
import {challengeDemon,advanceDemonPhase} from '../../src/combat/demon.js';
import {challengeKing} from '../../src/combat/upper-floors.js';
import {tickBossRecord,recordBossResource,completeBossRecord,growthRecordMarkup} from '../../src/progression/growth-records.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';

function encounter(kind){const s=newRun(5,{campaign:'expanded'});s.bossLayoutVersion=1;configureBossLayout(s);s.floor=kind==='demon'?7:9;s.room=s.floors[s.floor].findIndex(r=>r.type==='boss');assert.equal(kind==='demon'?challengeDemon(s):challengeKing(s),true);return s;}
test('pre-hunt remnant stages keep separate resources and resume the same stage after reload',()=>{
 let s=encounter('demon');let room=currentRoom(s);
 for(let stage=1;stage<=3;stage++){
  tickBossRecord(s,room,stage+1);recordBossResource(s,'damageTaken',stage);recordBossResource(s,'potionsUsed',1);
  if(stage<3){for(const e of room.enemies)e.hp=0;assert.equal(advanceDemonPhase(room,[]),true);}
 }
 s=parseSave(encodeSave(s));room=currentRoom(s);tickBossRecord(s,room,1);
 const r=s.metrics.bossRecords[0];assert.equal(r.seconds,10);
 assert.deepEqual(r.stages.entries.map(v=>[v.stage,v.seconds,v.damageTaken,v.potionsUsed]),[[1,2,1,1],[2,3,2,1],[3,5,3,1]]);
 assert.equal(r.stages.partial,false);assert.equal(r.resources.damageTaken,6);
 const before=JSON.stringify(s);assert.match(growthRecordMarkup(s),/3단계 본체/);assert.equal(JSON.stringify(s),before);
});
test('king skipped stage is not invented and observed transition time belongs to the new stage',()=>{
 const s=encounter('king'),room=currentRoom(s);tickBossRecord(s,room,1);
 room.enemies[0].kingStage=3;room.enemies[0].kingTransition=1.4;
 tickBossRecord(s,room,.5);recordBossResource(s,'damageTaken',2);
 const r=s.metrics.bossRecords[0];assert.deepEqual(r.stages.entries.map(v=>[v.stage,v.seconds,v.damageTaken]),[[1,1,0],[3,.5,2]]);
 completeBossRecord(s);tickBossRecord(s,room,1);recordBossResource(s,'potionsUsed',1);
 assert.equal(r.seconds,1.5);assert.equal(r.stages.entries[1].potionsUsed,0);assert.match(growthRecordMarkup(s),/3단계 각성/);
});
test('existing records start partial stage observations without reconstructing earlier phases',()=>{
 const s=encounter('king');s.metrics={bossRecords:[{floor:9,seconds:30,complete:false}]};
 currentRoom(s).enemies[0].kingStage=2;tickBossRecord(s,currentRoom(s),2);
 const r=s.metrics.bossRecords[0];assert.equal(r.seconds,32);assert.equal(r.stages.partial,true);
 assert.equal(r.stages.entries.length,1);assert.equal(r.stages.entries[0].stage,2);assert.equal(r.stages.entries[0].seconds,2);
 assert.match(growthRecordMarkup(parseSave(encodeSave(s))),/단계 기록은 일부 구간/);
 const missing=encounter('king');currentRoom(missing).enemies[0].kingStage=3;
 tickBossRecord(missing,currentRoom(missing),1);assert.equal(missing.metrics.bossRecords[0].stages.partial,true);
});
test('stage saves reject duplicates, invalid phase identities and malformed counts',()=>{
 const s=encounter('king');tickBossRecord(s,currentRoom(s),1);const r=s.metrics.bossRecords[0],entry={...r.stages.entries[0]};
 for(const stages of [null,[],{partial:'false',entries:[]},{partial:false,entries:[entry,entry]},
  ...[{kind:'unknown'},{stage:4},{seconds:-1},{damageTaken:Infinity},{potionsUsed:.5}].map(change=>({partial:false,entries:[{...entry,...change}]}))]){
  r.stages=stages;assert.throws(()=>encodeSave(s));
 }
 delete r.stages;assert.doesNotThrow(()=>parseSave(encodeSave(s)));
});
