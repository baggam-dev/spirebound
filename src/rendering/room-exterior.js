import {roomGeometry,roomDoorCenter,roomDoorFrame} from '../world/room-geometry.js';
const legacyTorches=Object.freeze([{x:85,y:82},{x:875,y:82},{x:85,y:455},{x:875,y:455}].map(Object.freeze));
export function roomTorchAnchors(room){
 const f=roomGeometry(room).footprint||{x:0,y:0,width:960,height:540};
 const anchors=roomGeometry(room).footprint?[{x:f.x+31,y:f.y+82},{x:f.x+f.width-31,y:f.y+82},{x:f.x+31,y:f.y+f.height-85},{x:f.x+f.width-31,y:f.y+f.height-85}]:legacyTorches;
 const frames=[0,1,2,3].filter(d=>room.doorPositions?.[d]!==null).map(d=>({...roomDoorFrame(room,d),w:d%2?29:80,h:d%2?70:35}));
 const safe=p=>frames.every(q=>p.x<q.x-52||p.x>q.x+q.w+52||p.y<q.y-52||p.y>q.y+q.h+52);
 const chosen=[];
 for(const p of anchors){
  const point=[0,-56,56,-112,112].map(dy=>({x:p.x,y:p.y+dy})).find(q=>q.y>=f.y+65&&q.y<=f.y+f.height-65&&safe(q)&&chosen.every(n=>Math.hypot(n.x-q.x,n.y-q.y)>64));
  if(point)chosen.push(point);
 }
 return chosen;
}

// Approved stone / iron / rune treatments. View only; entry geometry and RNG are untouched.
export function drawReadableDoors(c,room,{floor=0,locked=false,sealed=false,doors=[]}={}){
 const style=[2,3,8].includes(floor)?'rune':[1,6,9].includes(floor)?'iron':'stone';
 c.save();try{c.imageSmoothingEnabled=false;
  for(let d=0;d<4;d++)if(doors[d]){
   const p=roomDoorFrame(room,d),w=d%2?70:80,h=d%2?29:35;
   c.save();try{
    if(d===0)c.translate(p.x,p.y);
    else if(d===1){c.translate(p.x+29,p.y);c.rotate(Math.PI/2);}
    else if(d===2){c.translate(p.x+80,p.y+35);c.rotate(Math.PI);}
    else{c.translate(p.x,p.y+70);c.rotate(-Math.PI/2);}
    const edge=style==='rune'?'#8dafa9':style==='iron'?'#b49c73':'#b8b09a';
    c.fillStyle='#121a20';c.fillRect(0,0,w,h);
    c.fillStyle=style==='iron'?'#635647':'#67695f';c.fillRect(0,0,9,h);c.fillRect(w-9,0,9,h);c.fillRect(0,0,w,6);
    c.fillStyle=edge;c.fillRect(1,1,2,h-2);c.fillRect(w-3,1,2,h-2);c.fillRect(2,1,w-4,2);
    c.fillStyle='#343b3c';for(let y=10;y<h-4;y+=10){c.fillRect(3,y,6,2);c.fillRect(w-9,y,6,2);}
    c.fillStyle='#484b45';c.fillRect(10,h-12,w-20,10);
    c.fillStyle='#827d66';c.fillRect(8,h-5,w-16,5);c.fillStyle=locked?'#8c7960':'#e3cb8c';c.fillRect(9,h-4,w-18,2);
    c.strokeStyle='#777664';c.lineWidth=1;for(let x=20;x<w-10;x+=16){c.beginPath();c.moveTo(x,h-11);c.lineTo(x-3,h-5);c.stroke();}
    if(style==='iron'){c.fillStyle='#c1a36c';for(let x=14;x<w-9;x+=12){c.fillRect(x,3,3,locked?h-9:6);c.fillStyle='#e2c58a';c.fillRect(x,3,1,2);c.fillStyle='#c1a36c';}}
    if(style==='rune'){c.fillStyle='#83d2c2';for(const x of [5,w-7])for(let y=9;y<h-5;y+=9){c.fillRect(x,y,2,4);c.fillRect(x-1,y+1,4,1);}}
    if(locked){
     c.strokeStyle=sealed?'#c3a0da':'#b29a70';c.lineWidth=3;c.beginPath();c.moveTo(12,9);c.lineTo(w-12,h-7);c.moveTo(w-12,9);c.lineTo(12,h-7);c.stroke();
     if(sealed){const x=w/2,y=h/2;c.fillStyle='#302339';c.fillRect(x-7,y-7,14,14);c.strokeStyle='#d3afe8';c.lineWidth=1;c.beginPath();c.moveTo(x,y-6);c.lineTo(x+6,y);c.lineTo(x,y+6);c.lineTo(x-6,y);c.closePath();c.stroke();}
    }else{
     c.strokeStyle=style==='rune'?'#9bded0':'#e3cb8c';c.lineWidth=1;c.beginPath();c.moveTo(w/2-4,h-8);c.lineTo(w/2,h-11);c.lineTo(w/2+4,h-8);c.stroke();
    }
   }finally{c.restore();}
  }
 }finally{c.restore();}
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
