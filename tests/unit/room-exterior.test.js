import test from 'node:test';
import assert from 'node:assert/strict';
import {roomTorchAnchors,minimapRoomBox,minimapDoorFraction,roomRimSegments,drawRoomRim,drawReadableDoors} from '../../src/rendering/room-exterior.js';
import {roomGeometry,roomDoorCenter,roomDoorFrame} from '../../src/world/room-geometry.js';
import {drawInfernalAmbience} from '../../src/rendering/infernal-ambience.js';

test('open passages have no locked panel while all four directions preserve room state',()=>{
 const room={footprint:'corridor',doorPositions:[304,180,600,300]},before=JSON.stringify(room),rects=[];
 const c={save(){},restore(){},translate(){},rotate(){},fillRect(...r){rects.push({color:this.fillStyle,r});},beginPath(){},moveTo(){},lineTo(){},stroke(){},closePath(){}};
 drawReadableDoors(c,room,{floor:3,locked:true,doors:[true,true,true,true]});
 assert.equal(rects.filter(q=>q.color==='#3d4143').length,8);
 rects.length=0;drawReadableDoors(c,room,{floor:3,doors:[true,true,true,true]});
 assert.equal(rects.filter(q=>q.color==='#3d4143').length,0);
 assert.equal(rects.filter(q=>q.color==='#637a72').length,4);
 assert.equal(JSON.stringify(room),before);
});

test('infernal wall flames near shifted doors disappear without changing vent layout or room data',()=>{
 const room={doorPositions:[304,null,null,null]},before=JSON.stringify(room),rects=[],obstacles=[];
 const c={save(){},restore(){},beginPath(){},rect(){},clip(){},fillRect(...r){rects.push(r);}};
 drawInfernalAmbience(c,obstacles,8,0,false);
 assert.ok(rects.some(([x])=>x>=295&&x<=313));
 rects.length=0;drawInfernalAmbience(c,obstacles,8,0,false,room);
 assert.ok(rects.length>0);assert.ok(!rects.some(([x])=>x>=295&&x<=313));
 assert.equal(JSON.stringify(room),before);assert.deepEqual(obstacles,[]);
 rects.length=0;drawInfernalAmbience(c,obstacles,8,0,false);
 assert.ok(rects.some(([x])=>x>=295&&x<=313));
});
test('profile lighting and minimap share the room footprint while legacy presentation stays exact',()=>{
 const legacy={doorPositions:[null,270,null,270]};assert.deepEqual(roomTorchAnchors(legacy),[{x:85,y:82},{x:875,y:82},{x:85,y:455},{x:875,y:455}]);assert.deepEqual(minimapRoomBox(legacy,10,20,30),{x:10,y:20,w:30,h:30});
 for(const footprint of ['small','corridor']){const room={...legacy,footprint},before=JSON.stringify(room),f=roomGeometry(room).footprint,box=minimapRoomBox(room,0,0,30);
  for(const p of roomTorchAnchors(room))assert.ok(p.x>f.x&&p.x<f.x+f.width&&p.y>f.y&&p.y<f.y+f.height);
  assert.ok(Math.abs(box.w/box.h-(f.width/960)/(f.height/540))<1e-9);
  assert.ok(Math.abs(minimapDoorFraction(room,1)-(roomDoorCenter(room,1)-f.y)/f.height)<1e-9);assert.equal(JSON.stringify(room),before);
 }
});
test('rim leaves doorway gaps and restores canvas state without drawing a new exterior floor',()=>{
 const room={footprint:'small',doorPositions:[null,270,null,270]},f=roomGeometry(room).footprint,center=roomDoorCenter(room,1),segments=roomRimSegments(room);
 assert.ok(segments.every(e=>!(e.vertical&&e.axis===f.x+f.width&&e.start<center+35&&e.end>center-35)));
 const stack=[],rects=[],c={globalAlpha:.5,fillStyle:'red',save(){stack.push([this.globalAlpha,this.fillStyle]);},restore(){[this.globalAlpha,this.fillStyle]=stack.pop();},fillRect(x,y,w,h){rects.push([x,y,w,h]);}};
 drawRoomRim(c,room);assert.equal(c.globalAlpha,.5);assert.equal(c.fillStyle,'red');assert.equal(stack.length,0);assert.ok(rects.length>0);assert.ok(rects.every(r=>r[2]===1||r[3]===1));
});

test('torches avoid doorway and flame clearance without modifying room geometry',()=>{
 for(const footprint of [undefined,'small','corridor'])for(const n of [110,180,270,400]){
  const room={footprint,doorPositions:[120,n,840,n]},before=JSON.stringify(room),anchors=roomTorchAnchors(room);
  for(const p of anchors)for(let d=0;d<4;d++){
   const q=roomDoorFrame(room,d),w=d%2?29:80,h=d%2?70:35;
   assert.ok(p.x<q.x-52||p.x>q.x+w+52||p.y<q.y-52||p.y>q.y+h+52);
  }
  assert.equal(JSON.stringify(room),before);assert.deepEqual(roomTorchAnchors(room),anchors);
 }
});

test('door presentation restores state even if the painter throws and preserves saved room',()=>{
 const room={footprint:'small',doorPositions:[480,270,480,270]},before=JSON.stringify(room);
 let depth=0,transforms=0;
 const c={save(){depth++;},restore(){depth--;},translate(){transforms++;},rotate(){},fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},closePath(){}};
 for(const floor of [0,1,3])for(const locked of [false,true])drawReadableDoors(c,room,{floor,locked,sealed:locked,doors:[true,true,true,true]});
 assert.equal(depth,0);assert.equal(transforms,24);assert.equal(JSON.stringify(room),before);
 c.fillRect=()=>{throw Error('paint failed');};
 assert.throws(()=>drawReadableDoors(c,room,{doors:[true]}),/paint failed/);assert.equal(depth,0);assert.equal(JSON.stringify(room),before);
});
