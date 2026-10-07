import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,enrage,currentRoom,roomLocked,travel,canEscape} from '../../src/game/engine.js';
import {returnSealActive,releaseReturnSeal,prepareReturnSeals,finalApproachDepths} from '../../src/world/return-seals.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
import {enterRoom,stepRun} from '../../src/game/simulation.js';
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
 let count=0,total=0;for(let seed=0;seed<60;seed++){const s=newRun(seed);s.generationVersion=32;s.floors.flat().forEach(r=>r.seen=true);enrage(s);for(const r of s.floors.flat())if(r.type!=='down'&&r.enemies.length){total++;if(r.returnSeal==='guardian')count++;}
 const before=JSON.stringify(s.floors.map(rs=>rs.map(r=>[r.returnSeal,r.returnGuardianId,r.seenOnAscent])));enrage(s);prepareReturnSeals(s);assert.equal(JSON.stringify(s.floors.map(rs=>rs.map(r=>[r.returnSeal,r.returnGuardianId,r.seenOnAscent]))),before);
 }assert.ok(count/total>.27&&count/total<.33);
});
test('old descending saves without seal metadata retain access and blocked exit cannot be used',()=>{
 const s=newRun(4);s.generationVersion=27;s.key=true;s.room=0;assert.equal(roomLocked(s),false);assert.equal(canEscape(s),true);
 const r=currentRoom(s);r.returnSeal='guardian';r.returnSealReleased=false;r.returnGuardianId=42;r.enemies=[{id:42,hp:10}];assert.equal(canEscape(s),false);r.enemies[0].hp=0;assert.equal(returnSealActive(r),false);assert.equal(canEscape(s),true);
});
test('live movement cannot cross a sealed exit and can cross after clearance',()=>{
 const s=newRun(11);s.generationVersion=32;s.room=1;enrage(s);const r=currentRoom(s);assert.equal(r.returnSeal,'clear');s.invulnerable=999;s.attack=999;s.player.x=928;s.player.y=270;
 stepRun(s,.1,{x:1,y:0});assert.equal(s.room,1);r.enemies.forEach(e=>e.hp=0);stepRun(s,.001,{x:0,y:0});assert.equal(r.returnSealReleased,true);
 s.player.x=928;s.player.y=270;stepRun(s,.1,{x:1,y:0});assert.equal(s.room,2);
});

test('both approach layers cover every exit branch for visited and unseen campaigns',()=>{
 for(const campaign of ['classic','expanded'])for(let seed=0;seed<60;seed++){
  const s=newRun(seed,{campaign});s.floors.flat().forEach((r,i)=>r.seen=i%2===0);enrage(s);
  const rooms=s.floors[0],depths=finalApproachDepths(rooms);let count=0;
  for(const r of rooms){const depth=depths.get(r);if(depth===1||depth===2){count++;assert.equal(r.finalApproachDepth,depth);assert.equal(r.returnSeal,'guardian');assert.ok(returnSealActive(r));assert.ok(r.enemies.some(e=>e.id===r.returnGuardianId&&e.hp>0));}else assert.equal(r.finalApproachDepth,undefined);}
  assert.equal(count,4);assert.equal(rooms.find(r=>r.type==='exit').finalApproachDepth,undefined);assert.ok(parseSave(encodeSave(s)));
 }
});
test('forced guardian alone opens passage and persists through save and reentry',()=>{
 const s=newRun(112,{campaign:'expanded'});enrage(s);s.room=2;s.invulnerable=999;s.attack=999;
 const r=currentRoom(s);assert.equal(r.type,'fountain');assert.equal(r.finalApproachDepth,2);assert.ok(roomLocked(s));const id=r.returnGuardianId;
 r.enemies.find(e=>e.id===id).hp=0;assert.ok(stepRun(s,.001).events.includes('returnUnlock'));assert.ok(r.enemies.some(e=>e.hp>0));assert.equal(roomLocked(s),false);
 const loaded=parseSave(encodeSave(s));enterRoom(loaded);prepareReturnSeals(loaded);assert.equal(roomLocked(loaded),false);assert.equal(currentRoom(loaded).returnGuardianId,id);assert.equal(currentRoom(loaded).returnSealReleased,true);
});
test('legacy saves and random locks outside forced approach keep original seeded results',()=>{
 for(let seed=0;seed<40;seed++){
  const old=newRun(seed),now=newRun(seed);old.generationVersion=32;for(const s of [old,now]){s.floors.flat().forEach(r=>r.seen=true);enrage(s);}const depths=finalApproachDepths(now.floors[0]);
  old.floors.forEach((rooms,f)=>rooms.forEach((r,i)=>{assert.equal(r.finalApproachDepth,undefined);const n=now.floors[f][i];if(f===0&&[1,2].includes(depths.get(n)))return;assert.equal(n.returnSeal,r.returnSeal);assert.equal(n.returnGuardianId,r.returnGuardianId);}));
  const before=JSON.stringify(old);prepareReturnSeals(old);assert.equal(JSON.stringify(old),before);assert.ok(parseSave(encodeSave(old)));
 }
});
test('empty approach gets a living guardian with a unique id and never respawns it',()=>{
 const s=newRun(19);s.key=true;const r=s.floors[0][2];r.enemies=[{id:47,hp:0}];r.nextEnemyId=1;prepareReturnSeals(s);
 const guardian=r.enemies.find(e=>e.id===r.returnGuardianId);assert.equal(guardian.id,48);assert.ok(guardian.hp>0);assert.ok(returnSealActive(r));guardian.hp=0;releaseReturnSeal(r);prepareReturnSeals(s);assert.equal(r.enemies.length,2);assert.equal(returnSealActive(r),false);
});
test('save rejects approach metadata on wrong location, generation, or seal',()=>{
 const s=newRun(9);enrage(s);for(const mutate of [v=>v.generationVersion=32,v=>v.floors[0][1].finalApproachDepth=2,v=>v.floors[0][1].returnSeal='open',v=>v.floors[1][1].finalApproachDepth=1]){const v=structuredClone(s);mutate(v);assert.throws(()=>parseSave(encodeSave(v)));}
});
