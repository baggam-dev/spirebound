import {stoneFragments} from '../world/stone-shape.js';
// Existing damage values, shared with the separate attack visuals.
export const DEMON_EYE=Object.freeze({halfWidth:15,damage:9});
export const DEMON_TONGUE=Object.freeze({radius:155,halfAngle:.7,damage:9});
// The second phase needs a gap to escape the mouth while eye/nose attacks continue.
// Keep clocks within the existing save bounds and leave the final core unchanged.
export const DEMON_MOUTH_PHASE_TWO=Object.freeze({radius:210,speed:110,duration:.7,windup:.85,cooldown:3});
const pressureForce=Object.freeze({radius:360,speed:225,duration:1.2,windup:.42,cooldown:.65});
export const demonForceProfile=d=>d.pressureVersion===1&&d.phase===2?DEMON_MOUTH_PHASE_TWO:pressureForce;
const normal=Object.freeze([-.22,0,.22]),enhanced=Object.freeze([-.36,-.18,0,.18,.36]);
export const demonEyeOffsets=pressure=>pressure?enhanced:normal;
// First intersection of a ray with an obstacle rectangle, using segmentBlocked's padding convention.
export function demonRayLength(origin,angle,obstacles=[],limit=1200,padding=0){
 const dx=Math.cos(angle),dy=Math.sin(angle);let distance=limit;
 for(const source of obstacles)for(const o of stoneFragments(source)){let lo=0,hi=limit,hit=true;
  for(const [start,delta,min,max] of [[origin.x,dx,o.x-padding,o.x+o.w+padding],[origin.y,dy,o.y-padding,o.y+o.h+padding]]){
   if(Math.abs(delta)<1e-9){if(start<min||start>max){hit=false;break;}}
   else{const a=(min-start)/delta,b=(max-start)/delta;lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));if(lo>hi){hit=false;break;}}
  }
  if(hit)distance=Math.min(distance,Math.max(0,lo));
 }return distance;
}
