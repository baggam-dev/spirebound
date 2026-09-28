import test from 'node:test';
import assert from 'node:assert/strict';
import {applyRoomShape,chooseRoomShape,routeShapes} from '../../src/world/room-shapes.js';
import {blocked,segmentBlocked,steering,moveBody} from '../../src/world/terrain.js';
import {placeRoomObjects,objectPoint} from '../../src/world/object-positions.js';
import {stoneWallEdges} from '../../src/rendering/stone-walls.js';

// Independent grid search checks walkable topology, not a straight-line sight check.
function distances(obstacles,start,radius=24){
 const points=new Map(),queue=[start];points.set(`${start.x},${start.y}`,0);
 for(let i=0;i<queue.length;i++){
  const at=queue[i],cost=points.get(`${at.x},${at.y}`);
  for(const [dx,dy] of [[10,0],[-10,0],[0,10],[0,-10]]){
   const next={x:at.x+dx,y:at.y+dy},key=`${next.x},${next.y}`;
   if(next.x<40||next.x>920||next.y<60||next.y>480||points.has(key)||segmentBlocked(at,next,obstacles,radius))continue;
   points.set(key,cost+10);queue.push(next);
  }
 }
 return {points,queue};
}
test('eligible rooms split evenly between legacy and thin layout families',()=>{
 const counts=Array(7).fill(0);for(let i=0;i<1200;i++)counts[chooseRoomShape(()=>(i+.5)/1200)]++;
 assert.deepEqual(counts,[150,150,150,150,200,200,200]);
 for(const type of ['boss','normal','exit','up','down'])for(const choice of [4,5,6]){
  const r={type,obstacles:[],enemies:[]};applyRoomShape(r,choice);
  if(type!=='normal')assert.equal(routeShapes.has(r.shape),false);
 }
});
test('thin walls reduce footprint and connect every doorway, object and open pocket',()=>{
 const legacy={type:'normal',obstacles:[]};applyRoomShape(legacy,3);
 const area=obstacles=>obstacles.reduce((sum,o)=>sum+o.w*o.h,0);
 for(const choice of [4,5,6]){
  const r={type:'fountain',hasChest:true,obstacles:[],enemies:[{x:480,y:270}]};applyRoomShape(r,choice);
  assert.ok(area(r.obstacles)<area(legacy.obstacles)*.25);assert.ok(r.obstacles.every(o=>Math.min(o.w,o.h)<=28));
  assert.equal(blocked(r.enemies[0].x,r.enemies[0].y,24,r.obstacles),false);
  const reachable=distances(r.obstacles,{x:50,y:270},30);
  for(const p of [{x:910,y:270},{x:480,y:60},{x:480,y:480},{x:480,y:115},{x:600,y:115}])assert.ok(reachable.queue.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<=10&&!segmentBlocked(q,p,r.obstacles,24)),r.shape);
  for(let y=60;y<=480;y+=10)for(let x=40;x<=920;x+=10)if(!segmentBlocked({x,y},{x,y},r.obstacles,30))assert.ok(reachable.points.has(`${x},${y}`),`${r.shape}: isolated pocket ${x},${y}`);
  for(let i=0;i<12;i++){
   placeRoomObjects(r,()=>i/12);
   for(const p of [objectPoint(r),objectPoint(r,true)]){assert.equal(blocked(p.x,p.y,55,r.obstacles),false);assert.ok(reachable.queue.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<16&&!segmentBlocked(q,p,r.obstacles,24)));}
  }
  assert.ok(reachable.points.get('910,270')>900,`${r.shape}: must create a detour`);
 }
});
test('melee enemies can follow the existing steering around new walls',()=>{
 for(const choice of [4,5,6]){
  const r={type:'normal',obstacles:[]};applyRoomShape(r,choice);
  for(const [start,target] of [[{x:80,y:270},{x:880,y:270}],[{x:480,y:80},{x:480,y:460}]]){
   const body={...start};for(let i=0;i<1200&&Math.hypot(body.x-target.x,body.y-target.y)>5;i++){
    const angle=steering(body,target,r.obstacles,24);moveBody(body,Math.cos(angle)*3,Math.sin(angle)*3,r.obstacles,24);
   }
   assert.ok(Math.hypot(body.x-target.x,body.y-target.y)<=5,r.shape);
  }
 }
});
test('stone wall outlines omit shared joins including partially touching blocks',()=>{
 const walls=[{x:0,y:0,w:100,h:100},{x:100,y:20,w:40,h:30}];
 const edges=stoneWallEdges(walls);
 assert.deepEqual(edges.filter(e=>e.side==='right'&&e.axis===100).map(e=>[e.start,e.end]),[[0,20],[50,100]]);
 assert.equal(edges.some(e=>e.side==='left'&&e.axis===100),false);
 assert.equal(edges.reduce((sum,e)=>sum+e.end-e.start,0),480);
});
