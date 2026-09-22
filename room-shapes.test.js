import test from 'node:test';
import assert from 'node:assert/strict';
import {applyRoomShape} from './room-shapes.js';
import {blocked,segmentBlocked} from './terrain.js';
import {newRun,enrage} from './engine.js';
import {encodeSave,parseSave} from './storage.js';
test('all room shapes retain connected entrances and fixed object access',()=>{
 for(let shape=0;shape<4;shape++){
  const r={type:'normal',obstacles:[],enemies:[{x:80,y:80}]};applyRoomShape(r,shape);
  const center={x:480,y:270};for(const target of [{x:48,y:270},{x:912,y:270},{x:480,y:63},{x:480,y:477},{x:480,y:115}])assert.equal(segmentBlocked(center,target,r.obstacles,18),false);
  assert.equal(segmentBlocked({x:480,y:115},{x:600,y:115},r.obstacles,18),false);assert.equal(blocked(r.enemies[0].x,r.enemies[0].y,24,r.obstacles),false);
 }
});
test('new shapes persist on reload and descent while boss rooms stay unchanged',()=>{
 const styles=new Set();for(let seed=0;seed<8;seed++){const s=newRun(seed);for(const r of s.floors.flat()){if(r.type==='boss'||r.gate||r.tutorial)assert.ok(!r.obstacles.some(o=>o.type==='wall'));else styles.add(r.shape);assert.ok(r.obstacles.length<=30);}
  const before=JSON.stringify(s.floors.map(rs=>rs.map(r=>r.obstacles)));assert.equal(JSON.stringify(parseSave(encodeSave(s)).floors.map(rs=>rs.map(r=>r.obstacles))),before);enrage(s);assert.equal(JSON.stringify(s.floors.map(rs=>rs.map(r=>r.obstacles))),before);
 }assert.equal(styles.size,4);
});
