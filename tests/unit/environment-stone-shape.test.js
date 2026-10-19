import test from 'node:test';
import assert from 'node:assert/strict';
import {stoneFragments} from '../../src/world/stone-shape.js';
import {blocked,segmentBlocked} from '../../src/world/terrain.js';
import {demonRayLength} from '../../src/combat/demon-attack-shapes.js';

// Prepared with the implementation; run only after the next explicit deployment instruction.
test('broken stone corners are deterministic, bounded and do not modify saved geometry',()=>{
 for(const [w,h] of [[32,26],[80,60],[380,130]]){
  const o={type:'wall',x:260,y:180,w,h},before=JSON.stringify(o),parts=stoneFragments(o);
  assert.equal(JSON.stringify(o),before);assert.strictEqual(stoneFragments(o),parts);
  assert.deepEqual(stoneFragments(JSON.parse(before)),parts);
  assert.ok(parts.length>1);let area=0;
  for(const p of parts){assert.ok(p.w>0&&p.h>0);assert.ok(p.x>=o.x&&p.y>=o.y&&p.x+p.w<=o.x+w&&p.y+p.h<=o.y+h);area+=p.w*p.h;}
  assert.ok(area<w*h);assert.ok(area>=w*h-324);assert.ok(blocked(o.x+w/2,o.y+h/2,0,[o]));
 }
});
test('point, segment and demon ray collision agree with the visible stone pieces',()=>{
 const o={type:'wall',x:260,y:180,w:80,h:60},parts=stoneFragments(o);
 for(let y=o.y+.5;y<o.y+o.h;y+=2)for(let x=o.x+.5;x<o.x+o.w;x+=2){
  const expected=parts.some(p=>x>p.x&&x<p.x+p.w&&y>p.y&&y<p.y+p.h);
  assert.equal(blocked(x,y,0,[o]),expected);assert.equal(segmentBlocked({x,y},{x,y},[o]),expected);
 }
 for(let y=o.y+.5;y<o.y+o.h;y+=2){
  const origin={x:200,y},cut=parts.filter(p=>y>=p.y&&y<=p.y+p.h),expected=Math.min(...cut.map(p=>p.x-origin.x));
  assert.equal(demonRayLength(origin,0,[o]),expected);
  assert.equal(segmentBlocked(origin,{x:origin.x+expected-.01,y},[o]),false);
  assert.equal(segmentBlocked(origin,{x:origin.x+expected+.01,y},[o]),true);
 }
});
test('outer boundaries, narrow connectors, furniture and boss hazards keep original footprints',()=>{
 for(const o of [{x:0,y:0,w:960,h:44,type:'wall'},{x:0,y:35,w:25,h:475,type:'wall'},{x:260,y:180,w:20,h:60,type:'wall'},{x:260,y:180,w:80,h:60,type:'bookshelf'},{x:260,y:180,w:80,h:60,type:'wall',demonHole:true}])assert.deepEqual(stoneFragments(o),[o]);
});
test('moving or changing a wall invalidates derived geometry without touching the original cache result',()=>{
 const o={x:260,y:180,w:80,h:60,type:'wall'},parts=stoneFragments(o),before=JSON.stringify(parts);o.x+=30;
 const moved=stoneFragments(o);assert.notStrictEqual(moved,parts);assert.equal(JSON.stringify(parts),before);assert.ok(moved.every(p=>p.x>=o.x));
 o.type='table';assert.deepEqual(stoneFragments(o),[o]);
});
