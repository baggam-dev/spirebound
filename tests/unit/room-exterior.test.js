import test from 'node:test';
import assert from 'node:assert/strict';
import {roomTorchAnchors,minimapRoomBox,minimapDoorFraction,roomRimSegments,drawRoomRim} from '../../src/rendering/room-exterior.js';
import {roomGeometry,roomDoorCenter} from '../../src/world/room-geometry.js';
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
