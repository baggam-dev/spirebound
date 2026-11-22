import test from 'node:test';
import assert from 'node:assert/strict';
import {tryRoomFootprint,validRoomFootprint,planNewRoomFootprints,constrainRoomActors,registerRoomFootprints} from '../../src/world/room-footprints.js';
import {roomGeometry,roomDoorArrival,roomExitDirection,roomProjectileInside,roomRollBounds} from '../../src/world/room-geometry.js';
import {blocked,segmentBlocked} from '../../src/world/terrain.js';
const candidate=()=>({x:0,y:0,type:'normal',seen:false,used:false,shape:'standard',obstacles:[],doorPositions:[null,270,null,270],enemies:[{id:0,type:'chaser',x:240,y:270,hp:10},{id:1,type:'archer',x:700,y:270,hp:10}]});
test('small and corridor profiles preserve enemies and give both doors safe reachable arrival points',()=>{
 for(const profile of ['small','corridor']){const r=candidate(),stats=r.enemies.map(e=>[e.id,e.type,e.hp]);
  assert.equal(tryRoomFootprint(r,profile,[false,true,false,true]),true);
  assert.deepEqual(r.enemies.map(e=>[e.id,e.type,e.hp]),stats);
  for(const d of [1,3]){const p=roomDoorArrival(r,d);assert.equal(blocked(p.x,p.y,24,r.obstacles),false);const b=roomGeometry(r).recovery;p.x=d===1?b.maxX+2:b.minX-2;assert.equal(roomExitDirection(r,p),d);}
  assert.equal(roomProjectileInside(r,{x:480,y:270}),true);assert.equal(roomProjectileInside(r,{x:20,y:270}),false);
 }
});
test('an unsafe footprint fails without altering original geometry or actor state',()=>{
 const r=candidate();r.obstacles=[{x:450,y:240,w:80,h:80,type:'rock'}];const before=JSON.stringify(r);
 assert.equal(tryRoomFootprint(r,'small',[false,true,false,true]),false);assert.equal(JSON.stringify(r),before);
});
test('saved footprint validation rejects missing perimeter and foreign profiles while legacy rooms stay valid',()=>{
 const r=candidate(),rooms=[r,{x:1,y:0},{x:-1,y:0}];assert.ok(tryRoomFootprint(r,'small',[false,true,false,true]));
 const s={roomGeometryVersion:1,floors:[rooms]};assert.equal(validRoomFootprint(s,r,0),true);
 r.obstacles=[];assert.equal(validRoomFootprint(s,r,0),false);r.footprint='fake';assert.equal(validRoomFootprint(s,r,0),false);
 delete r.footprint;assert.equal(validRoomFootprint({},r,0),true);
});
test('new-room plans are deterministic, idempotent and do not consume the combat stream',()=>{
 let selected=0;
 for(let seed=1;seed<=16;seed++){
  const run={seed,randomState:42,floors:[[candidate(),{x:1,y:0,type:'boss',enemies:[]},{x:-1,y:0,type:'boss',enemies:[]}]]},copy=structuredClone(run);
  planNewRoomFootprints(run);planNewRoomFootprints(copy);assert.deepEqual(run,copy);assert.equal(run.randomState,42);
  const before=JSON.stringify(run);planNewRoomFootprints(run);assert.equal(JSON.stringify(run),before);selected+=Number(!!run.floors[0][0].footprint);
 }
 assert.ok(selected>0);
});
test('footprint repair keeps legal edge positions, dead actors and airborne trajectories unchanged',()=>{
 const r=candidate();assert.ok(tryRoomFootprint(r,'small',[false,true,false,true]));
 r.enemies[0].x=140;r.enemies[0].y=270;
 r.enemies.push({id:2,type:'chaser',x:80,y:80,hp:0},{id:3,type:'chaser',x:80,y:80,hp:10,phase:'air',landX:480,landY:270});
 const before=JSON.stringify(r.enemies);constrainRoomActors(r);assert.equal(JSON.stringify(r.enemies),before);
});
test('arrival repair relocates invalid actors without losing resources or overlapping the entrance',()=>{
 const r=candidate();assert.ok(tryRoomFootprint(r,'small',[false,true,false,true]));
 r.enemies[0].x=10;r.enemies[0].y=10;const arrival=roomDoorArrival(r,3),count=r.enemies.length;
 constrainRoomActors(r,arrival);
 assert.equal(r.enemies.length,count);assert.equal(r.enemies[0].hp,10);assert.equal(blocked(r.enemies[0].x,r.enemies[0].y,19,r.obstacles),false);
 assert.ok(Math.hypot(r.enemies[0].x-arrival.x,r.enemies[0].y-arrival.y)>=100);
 assert.deepEqual(roomRollBounds(r),{minX:150,maxX:810,minY:115,maxY:425});
 assert.deepEqual(roomRollBounds({}),{minX:50,maxX:910,minY:65,maxY:475});
});
test('reloaded obstacle arrays acquire bounds before return actors or shots can use exterior gaps',()=>{
 const r=candidate();assert.ok(tryRoomFootprint(r,'small',[false,true,false,true]));
 const copy=JSON.parse(JSON.stringify(r));registerRoomFootprints({floors:[[copy]]});
 assert.equal(blocked(90,270,19,copy.obstacles),true);
 assert.equal(segmentBlocked({x:480,y:270},{x:90,y:270},copy.obstacles),true);
 assert.equal(segmentBlocked({x:300,y:270},{x:600,y:270},copy.obstacles),false);
});
