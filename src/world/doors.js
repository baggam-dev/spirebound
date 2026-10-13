import {seededRandom} from '../game/random.js';
export const doorDirections=[[0,-1],[1,0],[0,1],[-1,0]];
export const doorCenter=(room,d)=>room.doorPositions?.[d]??(d%2?270:480);
export function doorArrival(room,d){const n=doorCenter(room,d);return {x:d===1?912:d===3?48:n,y:d===0?63:d===2?477:n};}
export function doorFramePoint(room,d){const n=doorCenter(room,d);return {x:d===1?931:d===3?0:n-40,y:d===0?0:d===2?505:n-35};}
function entryZone(room,d){const n=doorCenter(room,d);return d%2?{x:d===1?780:25,y:n-75,w:155,h:150}:{x:n-90,y:d===0?40:383,w:180,h:d===0?129:125};}
const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function subtract(o,z){
 if(!overlaps(o,z))return [o];if(o.type!=='wall')return [];
 const left=Math.max(o.x,z.x),right=Math.min(o.x+o.w,z.x+z.w),top=Math.max(o.y,z.y),bottom=Math.min(o.y+o.h,z.y+z.h);
 return [[o.x,o.y,left-o.x,o.h],[right,o.y,o.x+o.w-right,o.h],[left,o.y,right-left,top-o.y],[left,bottom,right-left,o.y+o.h-bottom]].filter(([, ,w,h])=>w>0&&h>0).map(([x,y,w,h])=>({...o,x,y,w,h}));
}
function carveEntries(room){
 const original=room.obstacles||[],zones=doorDirections.flatMap((_,d)=>room.doorPositions[d]===null?[]:[entryZone(room,d)]);
 let obstacles=original;
 for(const z of zones)obstacles=obstacles.flatMap(o=>subtract(o,z));
 // Avoid fragmenting geometry past the existing save limit.
 room.obstacles=obstacles.length<=30?obstacles:original.filter(o=>zones.every(z=>!overlaps(o,z)));
}
function points(room){
 const list=[];
 if(room.objectPosition)list.push(room.objectPosition);
 else if(['up','down','exit','treasure','shrine','event','boss'].includes(room.type))list.push({x:480,y:115});
 if(room.hasChest)list.push(room.chestPosition||{x:600,y:115});
 return list;
}
export function refreshDoorLayout(run){
 if(run.doorLayoutVersion===1)return;
 for(const [floor,rooms] of run.floors.entries()){
  const random=seededRandom(((run.seed||1)^Math.imul(floor+1,0x85ebca6b))>>>0);
  for(const room of rooms)room.doorPositions=[null,null,null,null];
  for(const room of rooms)for(const d of [1,2]){
   const [dx,dy]=doorDirections[d],other=rooms.find(r=>r.x===room.x+dx&&r.y===room.y+dy);if(!other)continue;
   let candidates=[.3,.4,.5,.6,.7].map(r=>Math.round(d%2?44+464*r:25+910*r));
   candidates=candidates.filter(n=>[...points(room),...points(other)].every(p=>{
    const a=doorArrival({...room,doorPositions:{[d]:n}},d),b=doorArrival({...other,doorPositions:{[(d+2)%4]:n}},(d+2)%4);
    return Math.hypot(p.x-a.x,p.y-a.y)>=90&&Math.hypot(p.x-b.x,p.y-b.y)>=90;
   }));
   const n=floor===9?(d%2?270:480):candidates[Math.floor(random()*candidates.length)]??(d%2?270:480);
   room.doorPositions[d]=n;other.doorPositions[(d+2)%4]=n;
  }
  if(floor!==9)for(const room of rooms)carveEntries(room);
 }
 run.doorLayoutVersion=1;
}
export function validDoorPairs(rooms){return rooms.every(room=>Array.isArray(room.doorPositions)&&room.doorPositions.length===4&&doorDirections.every(([dx,dy],d)=>{
 const other=rooms.find(r=>r.x===room.x+dx&&r.y===room.y+dy),n=room.doorPositions[d];
 return other?Number.isInteger(n)&&n>=(d%2?183:298)&&n<=(d%2?369:662)&&other.doorPositions?.[(d+2)%4]===n:n===null;
}));}
