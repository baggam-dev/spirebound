import {safeSpawn} from './terrain.js';
export const roomShapeNames=['standard','vertical','horizontal','compact','cross','staggered','maze'];
export const routeShapes=new Set(roomShapeNames.slice(4));
export function chooseRoomShape(random=Math.random){const roll=random();return roll<.5?Math.min(3,Math.floor(roll*8)):Math.min(6,4+Math.floor((roll-.5)*6));}
export function applyRoomShape(room,choice){
 if(room.type==='boss'||room.gate||room.tutorial)return;
 // Arrival points in stair/entrance rooms retain their established clear center.
 if(['exit','down','up'].includes(room.type)&&choice>=4)choice%=4;
 room.shape=roomShapeNames[choice]||'standard';if(room.shape==='standard')return;
 const vertical=room.shape!=='horizontal',horizontal=room.shape!=='vertical',walls=[];
 const add=(x,y,w,h)=>{for(let dx=0;dx<w;dx+=180)for(let dy=0;dy<h;dy+=180)walls.push({x:x+dx,y:y+dy,w:Math.min(180,w-dx),h:Math.min(180,h-dy),type:'wall'});};
 if(room.shape==='cross'){
  add(466,175,28,190);add(300,256,166,28);add(494,256,166,28);
 }else if(room.shape==='staggered'){
  add(330,145,28,220);add(602,215,28,220);
 }else if(room.shape==='maze'){
  add(300,155,28,220);add(328,347,140,28);add(620,185,28,220);add(480,185,140,28);
 }else{
 // Legacy shapes retain their broad central cross and doorway vestibules.
 if(vertical)for(const x of [25,780]){add(x,40,155,185);add(x,315,155,185);}
 if(horizontal){const left=vertical?180:25,right=vertical?780:935;
  add(left,40,420-left,90);add(655,40,right-655,90);
  add(left,410,420-left,90);add(540,410,right-540,90);
 }
 }
 // Thin layouts replace prop islands: clutter must not pinch their intentional passages.
 room.obstacles=[...(routeShapes.has(room.shape)?[]:(room.obstacles||[]).filter(o=>!walls.some(w=>o.x<w.x+w.w+28&&o.x+o.w>w.x-28&&o.y<w.y+w.h+28&&o.y+o.h>w.y-28))),...walls];
 for(const e of room.enemies||[])safeSpawn(e,room.obstacles,24);
}
