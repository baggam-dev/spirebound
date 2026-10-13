// World-space geometry shared by damage and the visible forward sweep.
export const CHASER_SLASH=Object.freeze({radius:55,halfAngle:Math.PI/3,playerRadius:14,duration:.12});
function distanceToRay(x,y,angle){
 const dx=Math.cos(angle),dy=Math.sin(angle),t=Math.max(0,Math.min(CHASER_SLASH.radius,x*dx+y*dy));
 return Math.hypot(x-dx*t,y-dy*t);
}
export function chaserSlashIntersects(e,p,aim){
 const x=p.x-e.x,y=p.y-e.y,d=Math.hypot(x,y),angle=Math.atan2(y,x);
 const delta=Math.atan2(Math.sin(angle-aim),Math.cos(angle-aim));
 const gap=Math.abs(delta)<=CHASER_SLASH.halfAngle?Math.max(0,d-CHASER_SLASH.radius):Math.min(distanceToRay(x,y,aim-CHASER_SLASH.halfAngle),distanceToRay(x,y,aim+CHASER_SLASH.halfAngle));
 return gap<=CHASER_SLASH.playerRadius;
}
