import {safeSpawn} from './terrain.js';
export const roomShapeNames=['standard','vertical','horizontal','compact'];
export function applyRoomShape(room,choice){
 if(room.type==='boss'||room.gate||room.tutorial)return;
 room.shape=roomShapeNames[choice]||'standard';if(room.shape==='standard')return;
 const vertical=room.shape!=='horizontal',horizontal=room.shape!=='vertical',walls=[];
 const add=(x,y,w,h)=>{for(let dx=0;dx<w;dx+=180)for(let dy=0;dy<h;dy+=180)walls.push({x:x+dx,y:y+dy,w:Math.min(180,w-dx),h:Math.min(180,h-dy),type:'wall'});};
 // All four exits retain broad vestibules; the top alcove also holds existing objects.
 if(vertical)for(const x of [25,780]){add(x,40,155,185);add(x,315,155,185);}
 if(horizontal){const left=vertical?180:25,right=vertical?780:935;
  add(left,40,420-left,90);add(655,40,right-655,90);
  add(left,410,420-left,90);add(540,410,right-540,90);
 }
 room.obstacles=[...(room.obstacles||[]).filter(o=>!walls.some(w=>o.x<w.x+w.w+28&&o.x+o.w>w.x-28&&o.y<w.y+w.h+28&&o.y+o.h>w.y-28)),...walls];
 for(const e of room.enemies||[])safeSpawn(e,room.obstacles,24);
}
