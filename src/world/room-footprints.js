import {roomGeometry,roomDoorArrival,roomDoorEntryZone,roomFootprints} from './room-geometry.js';
import {blocked,segmentBlocked,safeSpawn,registerObstacleFootprint} from './terrain.js';
const directions=[[0,-1],[1,0],[0,1],[-1,0]],types=new Set(['chaser','archer','charger','scatter','ricochet','laser']);
const connected=(rooms,r)=>directions.map(([x,y])=>rooms.some(n=>n.x===r.x+x&&n.y===r.y+y));
function cut(o,z){
 const l=Math.max(o.x,z.x),r=Math.min(o.x+o.w,z.x+z.w),t=Math.max(o.y,z.y),b=Math.min(o.y+o.h,z.y+z.h);
 if(l>=r||t>=b)return [o];return [[o.x,o.y,l-o.x,o.h],[r,o.y,o.x+o.w-r,o.h],[l,o.y,r-l,t-o.y],[l,b,r-l,o.y+o.h-b]].filter(a=>a[2]>0&&a[3]>0).map(([x,y,w,h])=>({x,y,w,h,type:'wall'}));
}
function perimeter(room,links){
 const f=roomGeometry(room).footprint,rects=[[25,40,f.x,460],[f.x+f.width-25,40,935-(f.x+f.width-25),460],[f.x+25,40,f.width-50,f.y],[f.x+25,f.y+f.height-40,f.width-50,540-f.y-f.height]];
 let walls=rects.filter(a=>a[2]>0&&a[3]>0).map(([x,y,w,h])=>({x,y,w,h,type:'wall'}));
 for(let d=0;d<4;d++)if(links[d])walls=walls.flatMap(o=>cut(o,roomDoorEntryZone(room,d)));
 return walls.flatMap(o=>{const pieces=[];for(let x=o.x;x<o.x+o.w;x+=180)for(let y=o.y;y<o.y+o.h;y+=180)pieces.push({...o,x,y,w:Math.min(180,o.x+o.w-x),h:Math.min(180,o.y+o.h-y)});return pieces;});
}
function reachable(room,links){
 const bounds=roomGeometry(room).recovery,points=[],seen=new Set(),queue=[{x:480,y:270}];
 if(blocked(480,270,28,room.obstacles))return false;
 for(let i=0;i<queue.length;i++){const p=queue[i],key=p.x+','+p.y;if(seen.has(key))continue;seen.add(key);points.push(p);
  for(const [dx,dy] of directions){const q={x:p.x+dx*20,y:p.y+dy*20};if(q.x<bounds.minX||q.x>bounds.maxX||q.y<bounds.minY||q.y>bounds.maxY||seen.has(q.x+','+q.y)||blocked(q.x,q.y,28,room.obstacles)||segmentBlocked(p,q,room.obstacles,28))continue;queue.push(q);}
 }
 const targets=room.enemies.concat(links.flatMap((yes,d)=>yes?[roomDoorArrival(room,d)]:[]));
 return targets.every(p=>points.some(q=>Math.hypot(p.x-q.x,p.y-q.y)<45&&!segmentBlocked(p,q,room.obstacles,24)));
}
export function tryRoomFootprint(room,profile,links){
 if(!roomFootprints[profile])return false;
 const trial={...room,footprint:profile,enemies:room.enemies.map(e=>({...e}))},f=roomFootprints[profile];
 trial.obstacles=(room.obstacles||[]).filter(o=>o.type!=='wall'&&o.x>=f.x+45&&o.x+o.w<=f.x+f.width-45&&o.y>=f.y+60&&o.y+o.h<=f.y+f.height-60).concat(perimeter(trial,links));
 registerObstacleFootprint(trial.obstacles,f);
 if(trial.obstacles.length>30)return false;
 for(const e of trial.enemies)safeSpawn(e,trial.obstacles,28);
 const bounds=roomGeometry(trial).recovery;
 if(trial.enemies.some((e,i)=>blocked(e.x,e.y,28,trial.obstacles)||e.x<bounds.minX||e.x>bounds.maxX||e.y<bounds.minY||e.y>bounds.maxY||trial.enemies.slice(0,i).some(a=>Math.hypot(e.x-a.x,e.y-a.y)<36)))return false;
 if(links.some((yes,d)=>yes&&blocked(roomDoorArrival(trial,d).x,roomDoorArrival(trial,d).y,24,trial.obstacles))||!reachable(trial,links))return false;
 room.footprint=profile;room.obstacles=trial.obstacles;trial.enemies.forEach((e,i)=>{room.enemies[i].x=e.x;room.enemies[i].y=e.y;});return true;
}
// Called only from newRun, after existing encounter plans. No run/combat random draws.
export function planNewRoomFootprints(run){
 if(run.roomGeometryVersion!==undefined)return;
 run.roomGeometryVersion=1;
 for(const [floor,rooms] of run.floors.entries()){
  if(floor>3)continue;
  for(const r of rooms){
   if(r.type!=='normal'||r.seen||r.used||r.tutorial||r.gate||r.hasChest||r.objectPosition||r.specialEncounter||r.pursuerEncounter||r.supportEncounter||r.sealEngine||!r.enemies.length||r.enemies.some(e=>!types.has(e.type))||['cross','staggered','maze'].includes(r.shape))continue;
   const hash=(Math.imul((run.seed||1)^Math.imul(floor+1,19349663),73856093)^Math.imul(r.x+17,83492791)^Math.imul(r.y+19,2654435761))>>>0;
   if(hash%4===0)continue;const links=connected(rooms,r),corridor=!links[0]&&!links[2]&&links[1]&&links[3];
   tryRoomFootprint(r,corridor&&hash%2===0?'corridor':'small',links);
  }
 }
}
export function validRoomFootprint(run,room,floor){
 if(room.footprint===undefined)return true;
 if(!(run.roomGeometryVersion===1&&floor<=3&&room.type==='normal'&&!room.gate&&!room.tutorial&&!room.hasChest&&!room.specialEncounter&&!room.pursuerEncounter&&!room.supportEncounter&&!room.sealEngine&&Object.hasOwn(roomFootprints,room.footprint)))return false;
 return perimeter(room,connected(run.floors[floor],room)).every(w=>(room.obstacles||[]).some(o=>o.type==='wall'&&o.x===w.x&&o.y===w.y&&o.w===w.w&&o.h===w.h));
}
const actorRadius=e=>(e.type==='ossuaryMinion'?15:e.type==='brute'||e.type==='demonCaptain'?24:19)*(e.scale??1);
export function registerRoomFootprints(run){for(const rooms of run.floors)for(const room of rooms)registerObstacleFootprint(room.obstacles,roomGeometry(room).footprint);}
export function constrainRoomActors(room,arrival=null,radiusFor=actorRadius){
 const f=roomGeometry(room).footprint;if(!f)return;
 registerObstacleFootprint(room.obstacles,f);
 for(const e of room.enemies){
  if(e.hp<=0||e.phase==='air'||e.phase==='splitJump'||e.attackPhase==='leap')continue;
  const radius=radiusFor(e);
  if(!blocked(e.x,e.y,radius,room.obstacles)&&(!arrival||Math.hypot(e.x-arrival.x,e.y-arrival.y)>=100))continue;
  const x=Math.max(f.x+radius,Math.min(f.x+f.width-radius,e.x)),y=Math.max(f.y+radius,Math.min(f.y+f.height-radius,e.y));
  let best=null;
  for(const spaced of [true,false]){
   for(let py=f.y+70;py<=f.y+f.height-70;py+=20)for(let px=f.x+60;px<=f.x+f.width-60;px+=20){
    if(arrival&&Math.hypot(px-arrival.x,py-arrival.y)<100||blocked(px,py,radius,room.obstacles))continue;
    if(spaced&&room.enemies.some(other=>other!==e&&other.hp>0&&Math.hypot(px-other.x,py-other.y)<radius+radiusFor(other)+4))continue;
    const distance=Math.hypot(px-x,py-y);if(!best||distance<best.distance)best={x:px,y:py,distance};
   }
   if(best)break;
  }
  if(best){e.x=best.x;e.y=best.y;}
 }
}
