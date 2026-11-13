import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom} from '../../src/game/engine.js';
import {stepRun} from '../../src/game/simulation.js';
import {usePotion} from '../../src/combat/abilities.js';
import {tickBossRecord,recordBossResource,completeBossRecord,growthRecordMarkup} from '../../src/progression/growth-records.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';

function encounter(){const s=newRun(5);s.floor=1;s.room=s.floors[1].findIndex(r=>r.type==='boss');return s;}
test('boss resource counts survive reload, exclude other rooms and stop on completion',()=>{
 let s=encounter();tickBossRecord(s,currentRoom(s),2);recordBossResource(s,'damageTaken',2);
 s.player.hp=3;s.player.potions=2;assert.equal(usePotion(s),true);assert.equal(usePotion(s),false);
 s=parseSave(encodeSave(s));const r=s.metrics.bossRecords[0];
 assert.deepEqual(r.resources,{damageTaken:2,potionsUsed:1,partial:false});
 const room=s.room;s.room=0;recordBossResource(s,'damageTaken',3);s.room=room;
 s.key=true;recordBossResource(s,'damageTaken',3);s.key=false;
 completeBossRecord(s);recordBossResource(s,'damageTaken',3);tickBossRecord(s,currentRoom(s),9);
 assert.equal(r.seconds,2);assert.equal(r.resources.damageTaken,2);assert.match(growthRecordMarkup(s),/물약 1회/);
});
test('legacy damage is unknown and only newly observed resources are marked partial',()=>{
 const s=encounter();s.metrics={bossRecords:[{floor:1,seconds:25,complete:false}]};
 assert.match(growthRecordMarkup(s),/피해·물약 미기록/);
 recordBossResource(s,'damageTaken',1);assert.equal(s.metrics.bossRecords[0].seconds,25);
 assert.deepEqual(s.metrics.bossRecords[0].resources,{damageTaken:1,potionsUsed:0,partial:true});
 assert.match(growthRecordMarkup(parseSave(encodeSave(s))),/일부 구간/);
 delete s.metrics.bossRecords[0].resources;s.metrics.bossRecords[0].complete=true;
 tickBossRecord(s,currentRoom(s),1);assert.equal(s.metrics.bossRecords[0].resources,undefined);
});
test('actual projectile heart loss is counted while invulnerable hits are excluded',()=>{
 const s=encounter();s.attack=999;for(const e of currentRoom(s).enemies)e.frozen=999;
 s.projectiles=[{x:470,y:300,vx:300,vy:0,life:2,enemy:true,hit:[],source:'시험 사수 탄환'}];
 stepRun(s,.05);assert.equal(s.metrics.bossRecords[0].resources.damageTaken,1);
 s.invulnerable=1;s.projectiles=[{x:470,y:300,vx:300,vy:0,life:2,enemy:true,hit:[],source:'무시할 탄환'}];
 stepRun(s,.05);assert.equal(s.metrics.bossRecords[0].resources.damageTaken,1);
});
test('resource save validation rejects malformed counts and accepts old records',()=>{
 const s=encounter();tickBossRecord(s,currentRoom(s),1);const r=s.metrics.bossRecords[0];
 for(const v of [null,[],{damageTaken:-1,potionsUsed:0,partial:false},{damageTaken:0,potionsUsed:.5,partial:false},{damageTaken:0,potionsUsed:0,partial:'false'}]){
  r.resources=v;assert.throws(()=>encodeSave(s));
 }
 delete r.resources;assert.doesNotThrow(()=>parseSave(encodeSave(s)));
});
