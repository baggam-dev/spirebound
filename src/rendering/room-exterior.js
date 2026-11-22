import {roomGeometry,roomDoorCenter} from '../world/room-geometry.js';
const legacyTorches=Object.freeze([{x:85,y:82},{x:875,y:82},{x:85,y:455},{x:875,y:455}].map(Object.freeze));
export function roomTorchAnchors(room){
 const f=roomGeometry(room).footprint;if(!f)return legacyTorches;
 return [{x:f.x+31,y:f.y+82},{x:f.x+f.width-31,y:f.y+82},{x:f.x+31,y:f.y+f.height-85},{x:f.x+f.width-31,y:f.y+f.height-85}];
}
export function minimapRoomBox(room,x,y,size){
 const f=roomGeometry(room).footprint,w=size*(f?f.width/960:1),h=size*(f?f.height/540:1);
 return {x:x+(size-w)/2,y:y+(size-h)/2,w,h};
}
export function minimapDoorFraction(room,d){
 const f=roomGeometry(room).footprint,n=roomDoorCenter(room,d);
 return f?(n-(d%2?f.y:f.x))/(d%2?f.height:f.width):room.doorPositions?(n-(d%2?44:25))/(d%2?464:910):.5;
}
export function roomRimSegments(room){
 const f=roomGeometry(room).footprint;if(!f)return [];
 return [0,1,2,3].flatMap(d=>{
  const vertical=d%2===1,start=vertical?f.y:f.x,end=start+(vertical?f.height:f.width),axis=d===0?f.y:d===1?f.x+f.width:d===2?f.y+f.height:f.x;
  const center=roomDoorCenter(room,d),half=vertical?35:40,open=room.doorPositions?.[d]!=null;
  const ranges=open?[[start,Math.max(start,center-half)],[Math.min(end,center+half),end]]:[[start,end]];
  return ranges.filter(([a,b])=>b>a).map(([a,b])=>({vertical,axis,start:a,end:b,sign:d===0||d===3?-1:1}));
 });
}
// A short dark falloff and thin edge, never a floor texture in the void.
export function drawRoomRim(c,room){
 const segments=roomRimSegments(room);if(!segments.length)return;
 c.save();try{
  for(const e of segments){
   for(let i=3;i>=1;i--){c.globalAlpha=.24/i;c.fillStyle='#000';const offset=e.axis+e.sign*i;c.fillRect(e.vertical?offset:e.start,e.vertical?e.start:offset,e.vertical?1:e.end-e.start,e.vertical?e.end-e.start:1);}
   c.globalAlpha=.10;c.fillStyle='#c7b89e';c.fillRect(e.vertical?e.axis:e.start,e.vertical?e.start:e.axis,e.vertical?1:e.end-e.start,e.vertical?e.end-e.start:1);
  }
 }finally{c.restore();}
}
export function drawRoomDoorGlow(c,room,locked=false){
 const f=roomGeometry(room).footprint;if(!f||locked)return;
 c.save();try{
  c.beginPath();c.rect(f.x+25,f.y+40,f.width-50,f.height-80);c.clip();c.globalAlpha=.07;
  for(let d=0;d<4;d++)if(room.doorPositions?.[d]!=null){
   const n=roomDoorCenter(room,d),x=d===1?f.x+f.width-29:d===3?f.x+29:n,y=d===0?f.y+44:d===2?f.y+f.height-40:n;
   const light=c.createRadialGradient(x,y,1,x,y,34);light.addColorStop(0,'#e7c58a');light.addColorStop(1,'#e7c58a00');c.fillStyle=light;c.fillRect(x-34,y-34,68,68);
  }
 }finally{c.restore();}
}
