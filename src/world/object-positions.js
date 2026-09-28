import {blocked,segmentBlocked} from './terrain.js';
export const objectPoint=(room,extraChest=false)=>room[extraChest?'chestPosition':'objectPosition']||{x:extraChest?600:480,y:115};
export function placeRoomObjects(room,random=Math.random){
 if(room.type==='boss'||room.gate||room.tutorial)return;
 const spots=[];
 for(let y=175;y<=365;y+=38)for(let x=240;x<=720;x+=60){
  if(blocked(x,y,55,room.obstacles)||segmentBlocked({x:480,y:270},{x,y},room.obstacles,22))continue;
  if([[48,270],[912,270],[480,63],[480,477]].some(([a,b])=>Math.hypot(x-a,y-b)<145))continue;
  spots.push({x,y});
 }
 const choose=other=>{const pool=spots.filter(p=>!other||Math.hypot(p.x-other.x,p.y-other.y)>=150);if(!pool.length)return undefined;return {...pool[Math.min(pool.length-1,Math.floor(random()*pool.length))]};};
 if(['treasure','fountain','shrine','event'].includes(room.type))room.objectPosition=choose();
 if(room.hasChest)room.chestPosition=choose(objectPoint(room));
}
