import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,neighbor,currentRoom} from '../../src/game/engine.js';
import {validDoorPairs,doorArrival} from '../../src/world/doors.js';
import {blocked} from '../../src/world/terrain.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
import {stepRun} from '../../src/game/simulation.js';
import {atExit} from '../helpers/door-fixture.js';
test('all shifted door pairs are safe, traversable, and persist without repeated transforms',()=>{
 const positions=new Set(),directions=new Set();
 for(let seed=0;seed<30;seed++){
  const s=newRun(seed,{campaign:'expanded'});s.tutorialComplete=true;
  for(let f=0;f<9;f++){
   const rooms=s.floors[f],goal=rooms.find(r=>r.type==='up')||rooms.find(r=>r.type==='boss');
   directions.add(Math.abs(goal.x)>=Math.abs(goal.y)?(goal.x>0?'east':'west'):(goal.y>0?'south':'north'));
   assert.ok(validDoorPairs(rooms));
   for(let i=0;i<rooms.length;i++)for(let d=0;d<4;d++){
    s.floor=f;s.room=i;const n=neighbor(s,d);if(n<0)continue;const room=currentRoom(s);
    positions.add(room.doorPositions[d]);const entry=doorArrival(room,d);assert.equal(blocked(entry.x,entry.y,24,room.obstacles),false,`${seed}/${f}/${i}/${d}`);
    const original=room.enemies;room.enemies=[];room.used=true;s.attack=999;s.invulnerable=999;const input=atExit(s,d);stepRun(s,.01,input);assert.equal(s.room,n);assert.equal(blocked(s.player.x,s.player.y,14,currentRoom(s).obstacles),false);room.enemies=original;
   }
  }
  const fresh=newRun(seed,{campaign:'expanded'});const before=fresh.floors.map(rs=>rs.map(r=>[r.x,r.y,r.doorPositions]));const loaded=parseSave(encodeSave(fresh));assert.deepEqual(loaded.floors.map(rs=>rs.map(r=>[r.x,r.y,r.doorPositions])),before);
 }
 assert.equal(directions.size,4);assert.ok(positions.size>=8);
});
test('mismatched door pairs are rejected on saving',()=>{const s=newRun(9);const room=s.floors[0].find(r=>r.doorPositions.some(n=>n!==null)),d=room.doorPositions.findIndex(n=>n!==null);room.doorPositions[d]++;assert.throws(()=>encodeSave(s));});
