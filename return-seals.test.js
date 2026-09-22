import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,enrage,currentRoom,roomLocked,travel,canEscape} from './engine.js';
import {returnSealActive,releaseReturnSeal,prepareReturnSeals} from './return-seals.js';
import {encodeSave,parseSave} from './storage.js';
import {enterRoom,stepRun} from './simulation.js';
test('stairs take priority over unexplored rooms and require all enemies before descending',()=>{
 const s=newRun(12);s.floor=4;s.room=0;enrage(s);const r=currentRoom(s);assert.equal(r.returnSeal,'stairs');assert.equal(r.seenOnAscent,false);assert.equal(roomLocked(s),false);assert.equal(travel(s,-1),false);
 r.enemies.slice(1).forEach(e=>e.hp=0);assert.equal(travel(s,-1),false);r.enemies[0].hp=0;assert.equal(releaseReturnSeal(r),true);assert.equal(travel(s,-1),true);
});
test('unvisited rooms require all kills even after first descent visit is saved',()=>{
 const s=newRun(12);s.floor=2;s.room=3;enrage(s);const r=currentRoom(s);assert.equal(r.returnSeal,'clear');enterRoom(s);assert.equal(r.seen,true);assert.equal(r.seenOnAscent,false);assert.equal(roomLocked(s),true);
 const loaded=parseSave(encodeSave(s));assert.equal(roomLocked(loaded),true);r.enemies[0].hp=0;assert.equal(roomLocked(s),true);r.enemies.forEach(e=>e.hp=0);assert.equal(releaseReturnSeal(r),true);r.enemies.push({id:999,hp:10});assert.equal(roomLocked(s),false);
});
test('guardian alone unlocks visited rooms and re-entry never rolls a new lock',()=>{
 let s;for(let seed=0;seed<30;seed++){const run=newRun(seed);run.floors.flat().forEach(r=>r.seen=true);enrage(run);const index=run.floors[0].findIndex(r=>r.returnSeal==='guardian'&&!r.returnSealReleased);if(index>=0){s=run;s.room=index;break;}}
 assert.ok(s);const r=currentRoom(s),guardian=r.enemies.find(e=>e.id===r.returnGuardianId);assert.ok(guardian.elite);assert.equal(roomLocked(s),true);guardian.hp=0;s.invulnerable=999;s.attack=999;
 const events=stepRun(s,.001).events;assert.ok(events.includes('returnUnlock'));assert.ok(r.enemies.some(e=>e.hp>0));assert.equal(roomLocked(s),false);enterRoom(s);prepareReturnSeals(s);assert.equal(r.returnSealReleased,true);assert.equal(roomLocked(parseSave(encodeSave(s))),false);
});
test('visited room guardian rate is approximately thirty percent and deterministic',()=>{
 let count=0,total=0;for(let seed=0;seed<60;seed++){const s=newRun(seed);s.floors.flat().forEach(r=>r.seen=true);enrage(s);for(const r of s.floors.flat())if(r.type!=='down'&&r.enemies.length){total++;if(r.returnSeal==='guardian')count++;}
 const before=JSON.stringify(s.floors.map(rs=>rs.map(r=>[r.returnSeal,r.returnGuardianId,r.seenOnAscent])));enrage(s);prepareReturnSeals(s);assert.equal(JSON.stringify(s.floors.map(rs=>rs.map(r=>[r.returnSeal,r.returnGuardianId,r.seenOnAscent]))),before);
 }assert.ok(count/total>.27&&count/total<.33);
});
test('old descending saves without seal metadata retain access and blocked exit cannot be used',()=>{
 const s=newRun(4);s.key=true;s.room=0;assert.equal(roomLocked(s),false);assert.equal(canEscape(s),true);
 const r=currentRoom(s);r.returnSeal='guardian';r.returnSealReleased=false;r.returnGuardianId=42;r.enemies=[{id:42,hp:10}];assert.equal(canEscape(s),false);r.enemies[0].hp=0;assert.equal(returnSealActive(r),false);assert.equal(canEscape(s),true);
});
test('live movement cannot cross a sealed exit and can cross after clearance',()=>{
 const s=newRun(11);s.room=1;enrage(s);const r=currentRoom(s);assert.equal(r.returnSeal,'clear');s.invulnerable=999;s.attack=999;s.player.x=928;s.player.y=270;
 stepRun(s,.1,{x:1,y:0});assert.equal(s.room,1);r.enemies.forEach(e=>e.hp=0);stepRun(s,.001,{x:0,y:0});assert.equal(r.returnSealReleased,true);
 s.player.x=928;s.player.y=270;stepRun(s,.1,{x:1,y:0});assert.equal(s.room,2);
});
