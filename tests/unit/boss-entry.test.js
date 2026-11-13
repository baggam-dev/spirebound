import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom} from '../../src/game/engine.js';
import {usePotion} from '../../src/combat/abilities.js';
import {tickBossRecord,observeBossEncounter,growthRecordMarkup} from '../../src/progression/growth-records.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';

function encounter(){const s=newRun(5);s.floor=1;s.room=s.floors[1].findIndex(r=>r.type==='boss');return s;}
test('first boss growth observation survives reload and is not overwritten on reentry',()=>{
 let s=encounter();s.player.hp=3;tickBossRecord(s,currentRoom(s),1);
 const entry={...s.metrics.bossRecords[0].entry};assert.equal(entry.partial,false);assert.equal(entry.hp,3);
 s.player.damage+=10;s.player.hp=4;const room=s.room;s.room=0;observeBossEncounter(s);s.room=room;s=parseSave(encodeSave(s));observeBossEncounter(s);
 assert.deepEqual(s.metrics.bossRecords[0].entry,entry);
 const before=JSON.stringify(s);assert.match(growthRecordMarkup(s),/교전 첫 관찰/);assert.equal(JSON.stringify(s),before);
});
test('potion before the first simulation tick captures the pre-use state and does not poison global totals',()=>{
 const s=encounter();s.player.hp=3;s.player.potions=2;assert.equal(usePotion(s),true);
 assert.equal(s.metrics.bossRecords[0].entry.hp,3);assert.equal(s.metrics.bossRecords[0].entry.potions,2);
 assert.equal(s.metrics.bossRecords[0].resources.potionsUsed,1);assert.equal(s.metrics.potionsUsed,1);
 assert.doesNotThrow(()=>parseSave(encodeSave(s)));
 const t=encounter();assert.equal(usePotion(t),false);assert.equal(t.metrics,undefined);
});
test('legacy ongoing observations are marked late while old completed records stay unknown',()=>{
 const s=encounter();s.metrics={bossRecords:[{floor:1,seconds:20,complete:false}]};observeBossEncounter(s);
 assert.equal(s.metrics.bossRecords[0].entry.partial,true);assert.match(growthRecordMarkup(s),/중간부터 관찰/);
 const r=s.metrics.bossRecords[0];delete r.entry;r.complete=true;observeBossEncounter(s);
 assert.equal(r.entry,undefined);assert.match(growthRecordMarkup(s),/교전 첫 성장 상태 미기록/);
});
test('entry saves reject invalid snapshots and preserve compatibility with missing snapshots',()=>{
 const s=encounter();observeBossEncounter(s);const r=s.metrics.bossRecords[0],entry={...r.entry};
 for(const v of [null,[],...[{level:0},{hp:entry.max+1},{damage:NaN},{relics:.5},{potions:-1},{partial:1}].map(change=>({...entry,...change}))]){
  r.entry=v;assert.throws(()=>encodeSave(s));
 }
 delete r.entry;assert.doesNotThrow(()=>parseSave(encodeSave(s)));
});
