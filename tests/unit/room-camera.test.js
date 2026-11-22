import test from 'node:test';
import assert from 'node:assert/strict';
import {roomGeometry,roomDoorArrival,roomDoorFrame,roomDoorEntryZone} from '../../src/world/room-geometry.js';
import {createRoomCamera,worldToScreen,screenToWorld,withRoomCamera,ROOM_VOID_COLOR} from '../../src/rendering/room-camera.js';

test('legacy door and recovery geometry remains exact and never writes room profiles',()=>{
 const room={shape:'compact',doorPositions:[301,211,null,344]},before=JSON.stringify(room);
 assert.deepEqual(roomGeometry(room).recovery,{minX:31,maxX:929,minY:49,maxY:491});
 assert.deepEqual(roomDoorArrival(room,0),{x:301,y:63});assert.deepEqual(roomDoorArrival(room,1),{x:912,y:211});
 assert.deepEqual(roomDoorArrival(room,2),{x:480,y:477});assert.deepEqual(roomDoorArrival(room,3),{x:48,y:344});
 assert.deepEqual(roomDoorFrame(room,3),{x:0,y:309});assert.deepEqual(roomDoorEntryZone(room,1),{x:780,y:136,w:155,h:150});
 assert.equal(JSON.stringify(room),before);assert.equal(Object.isFrozen(roomGeometry(room).frame),true);
});
test('camera fits common combat frame across device ratios and input projection roundtrips',()=>{
 for(const [w,h] of [[960,540],[844,390],[1280,720],[390,844]]){
  const camera=createRoomCamera(w,h),top=worldToScreen(camera,{x:0,y:0}),bottom=worldToScreen(camera,{x:960,y:540});
  assert.ok(top.x>=-1e-9&&top.y>=-1e-9);assert.ok(bottom.x<=w+1e-9&&bottom.y<=h+1e-9);
  for(const point of [{x:48,y:211},{x:480,y:270},{x:912,y:344}]){const back=screenToWorld(camera,worldToScreen(camera,point));assert.ok(Math.abs(back.x-point.x)<1e-9&&Math.abs(back.y-point.y)<1e-9);}
 }
 const wide=createRoomCamera(844,390);assert.ok(wide.x>0);assert.equal(wide.y,0);
 assert.ok(Number.isFinite(createRoomCamera(NaN,0).scale));
});
test('black camera clear restores caller canvas state even after a failed world draw',()=>{
 const stack=[],c={globalAlpha:.4,globalCompositeOperation:'multiply',fillStyle:'red',transform:[2,0,0,2,5,6],
  save(){stack.push([this.globalAlpha,this.globalCompositeOperation,this.fillStyle,this.transform]);},
  restore(){[this.globalAlpha,this.globalCompositeOperation,this.fillStyle,this.transform]=stack.pop();},
  setTransform(...v){this.transform=v;},fillRect(){assert.equal(this.fillStyle,ROOM_VOID_COLOR);assert.equal(this.globalAlpha,1);}};
 const before=JSON.stringify(c);assert.throws(()=>withRoomCamera(c,createRoomCamera(844,390),()=>{throw Error('draw failed');}));assert.equal(JSON.stringify(c),before);assert.equal(stack.length,0);
});
