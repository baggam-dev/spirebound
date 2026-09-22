import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,enrage} from './engine.js';
import {objectPoint} from './object-positions.js';
import {blocked,segmentBlocked} from './terrain.js';
import {encodeSave,parseSave} from './storage.js';
test('random objects remain accessible, separated and stable through save and return',()=>{
 const positions=new Set();for(let seed=0;seed<40;seed++){const s=newRun(seed);
  for(const r of s.floors.flat())for(const key of ['objectPosition','chestPosition'])if(r[key]){const p=r[key];positions.add(`${p.x},${p.y}`);assert.equal(blocked(p.x,p.y,55,r.obstacles),false);assert.equal(segmentBlocked({x:480,y:270},p,r.obstacles,22),false);if(key==='chestPosition')assert.ok(Math.hypot(p.x-objectPoint(r).x,p.y-objectPoint(r).y)>=150);}
  const coords=s=>JSON.stringify(s.floors.map(rs=>rs.map(r=>[r.objectPosition,r.chestPosition]))),before=coords(s);assert.equal(coords(parseSave(encodeSave(s))),before);enrage(s);assert.equal(coords(s),before);
 }assert.ok(positions.size>12);
});
test('legacy rooms retain original object and extra chest anchors',()=>{
 assert.deepEqual(objectPoint({type:'fountain'}),{x:480,y:115});assert.deepEqual(objectPoint({},true),{x:600,y:115});
});
