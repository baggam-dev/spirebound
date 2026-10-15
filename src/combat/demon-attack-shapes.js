// Existing damage values, shared with the separate attack visuals.
export const DEMON_EYE=Object.freeze({halfWidth:15,damage:9});
export const DEMON_TONGUE=Object.freeze({radius:155,halfAngle:.7,damage:9});
const normal=Object.freeze([-.22,0,.22]),enhanced=Object.freeze([-.36,-.18,0,.18,.36]);
export const demonEyeOffsets=pressure=>pressure?enhanced:normal;
// First intersection of a ray with an obstacle rectangle, using segmentBlocked's padding convention.
export function demonRayLength(origin,angle,obstacles=[],limit=1200,padding=0){
 const dx=Math.cos(angle),dy=Math.sin(angle);let distance=limit;
 for(const o of obstacles){let lo=0,hi=limit,hit=true;
  for(const [start,delta,min,max] of [[origin.x,dx,o.x-padding,o.x+o.w+padding],[origin.y,dy,o.y-padding,o.y+o.h+padding]]){
   if(Math.abs(delta)<1e-9){if(start<min||start>max){hit=false;break;}}
   else{const a=(min-start)/delta,b=(max-start)/delta;lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));if(lo>hi){hit=false;break;}}
  }
  if(hit)distance=Math.min(distance,Math.max(0,lo));
 }return distance;
}
