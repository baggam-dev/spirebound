import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom} from '../../src/game/engine.js';
import {fairyPosition} from '../../src/combat/fairy-position.js';
import {tickPassives} from '../../src/progression/passives.js';
import {tickFairyKing} from '../../src/combat/fairy-king.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
test('fairy orbit is deterministic, bounded, paused with elapsed time and survives reload',()=>{
 const s=newRun(31);s.elapsed=8;const before=JSON.stringify(s),poses=[0,1,2,3].map(i=>fairyPosition(s,i));
 assert.deepEqual([0,1,2,3].map(i=>fairyPosition(s,i)),poses);assert.equal(JSON.stringify(s),before);
 const restored=parseSave(encodeSave(s));assert.deepEqual([0,1,2,3].map(i=>fairyPosition(restored,i)),poses);
 s.elapsed+=1;for(let i=0;i<4;i++){const p=fairyPosition(s,i);assert.notDeepEqual(p,poses[i]);assert.ok(Math.hypot(p.x-s.player.x,p.y-s.player.y)<60);}
});
test('fairy projectile and king beam use the same visible pose, with a wall-safe fallback',()=>{
 const s=newRun(31),r=currentRoom(s);r.enemies=[{id:0,type:'archer',x:650,y:300,hp:10000,max:10000}];r.obstacles=[];s.elapsed=1;s.player.sunFairy=1;s.passiveClocks={sunFairy:0};
 const p=fairyPosition(s,0,r.obstacles);tickPassives(s,.01);const b=s.projectiles.find(b=>b.passive==='sunFairy');assert.equal(b.x,p.x);assert.equal(b.y,p.y);
 s.player.fairyKing=1;s.fairyKingClock=0;const king=fairyPosition(s,3,r.obstacles);tickFairyKing(s,r,.01);assert.equal(r.fairyBeam.x,king.x);assert.equal(r.fairyBeam.y,king.y);
 r.obstacles=[{type:'rock',x:s.player.x-40,y:s.player.y-40,w:80,h:20}];assert.deepEqual(fairyPosition(s,3,r.obstacles),{x:s.player.x,y:s.player.y});
});
