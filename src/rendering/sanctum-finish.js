import {doorArrival,doorDirections} from '../world/doors.js';

const mix=n=>{n=Math.imul(n^(n>>>16),0x45d9f3b);return (n^(n>>>16))>>>0;};
const plans=new WeakMap();
// Render-only material profile: blue slate is quiet, limestone separates wall height.
export function sanctumTone(red,green,blue,wall=false){
 const grey=red*.2126+green*.7152+blue*.0722;
 const tone=wall?Math.max(66,Math.min(116,87+(grey-53)*.7)):Math.max(31,Math.min(65,46+(grey-53)*.52));
 return (wall?[tone+9,tone+7,tone+1]:[tone-3,tone+2,tone+8]).map(n=>Math.round(n/4)*4);
}
export function sanctumPlan(s,r){
 const rooms=s.floors?.[s.floor]||[],doors=doorDirections.map(([dx,dy],d)=>rooms.some(n=>n.x===r.x+dx&&n.y===r.y+dy)?d:null).filter(d=>d!==null);
 const stamp=[s.seed,s.floor,r.x,r.y,...doors.map(d=>`${d}:${r.doorPositions?.[d]}`),r.type,r.objectPosition?.x,r.objectPosition?.y,r.chestPosition?.x,r.chestPosition?.y,r.hasChest].join(':');
 const cached=plans.get(r);if(cached?.stamp===stamp)return cached.plan;
 const seed=mix((s.seed||1)^Math.imul((r.x||0)+19,99173)^Math.imul((r.y||0)+31,51787)^Math.imul(s.floor+1,73471));
 const thresholds=doors.map(d=>Object.freeze({d,...doorArrival(r,d)})),cracks=[];
 const facilities=[];if(['treasure','shrine','fountain','event','up','down','exit','boss'].includes(r.type))facilities.push(r.objectPosition||{x:480,y:115});if(r.hasChest)facilities.push(r.chestPosition||{x:600,y:115});
 for(let i=0;i<14;i++){
  const h=mix(seed+i*193),x=95+h%770,y=i%2?409+(h>>>12)%37:104+(h>>>12)%31;
  if(thresholds.some(p=>Math.hypot(x-p.x,y-p.y)<100)||facilities.some(p=>Math.hypot(x-p.x,y-p.y)<80))continue;
  cracks.push(Object.freeze({x,y,flip:h&1?1:-1,length:12+(h>>>18)%15}));
 }
 const plan=Object.freeze({seed,thresholds:Object.freeze(thresholds),cracks:Object.freeze(cracks)});plans.set(r,{stamp,plan});return plan;
}
export function paintSanctumInlay(c,s,r){
 const plan=sanctumPlan(s,r);c.save();
 // Inset corners, never a continuous rectangle that could read as an area warning.
 for(const x of [110,850])for(const y of [121,425]){
  const dx=x<480?1:-1,dy=y<270?1:-1;c.fillStyle='#a69a7730';c.fillRect(x+(dx<0?-45:0),y,45,2);c.fillRect(x,y+(dy<0?-24:0),2,24);
  c.fillStyle='#d2c6a42b';c.fillRect(x+dx*6,y+dy*6,4,4);
 }
 for(const p of plan.thresholds){
  const side=p.d%2,xx=side?(p.d===1?872:49):p.x-30,yy=side?p.y-30:(p.d===0?64:454);
  c.fillStyle='#8c929b12';c.fillRect(xx,yy,side?38:60,side?60:28);c.fillStyle='#b2a17b32';
  if(side){c.fillRect(xx+7,yy+4,2,52);c.fillRect(xx+24,yy+4,2,52);}else{c.fillRect(xx+4,yy+6,52,2);c.fillRect(xx+4,yy+20,52,2);}
 }
 // Fine erosion is bounded at the room edge, leaving the middle free for combat.
 for(const p of plan.cracks){c.fillStyle='#18212b3b';c.fillRect(p.x,p.y,p.length,2);c.fillRect(p.x+8,p.y+(p.flip<0?-6:2),2,6);c.fillStyle='#bbc4c512';c.fillRect(p.x,p.y-2,p.length-3,1);}
 c.restore();
}
export function drawReturnAtmosphere(c,s,r){
 if(!s.key)return;const plan=sanctumPlan(s,r);c.save();c.beginPath();c.rect(26,45,908,455);c.clip();
 c.fillStyle='#202c421c';c.fillRect(26,45,908,455);
 // Static broken seal strokes, not emissive danger glyphs or animated projectiles.
 for(const p of plan.cracks){
  c.strokeStyle='#171c2d77';c.lineWidth=2;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x+8,p.y+4*p.flip);c.lineTo(p.x+14,p.y+p.flip);c.lineTo(p.x+p.length,p.y+7*p.flip);c.stroke();
  c.strokeStyle='#8e83a333';c.lineWidth=1;c.beginPath();c.moveTo(p.x+2,p.y-1);c.lineTo(p.x+8,p.y+4*p.flip-1);c.lineTo(p.x+14,p.y+p.flip-1);c.stroke();
 }
 c.restore();
}
