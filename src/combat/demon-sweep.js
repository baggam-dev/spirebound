// The warning and the one-shot damage check use exactly the same sector.
export const DEMON_SWEEP=Object.freeze({windup:.9,strike:.14,recover:.34,radius:80,halfAngle:Math.PI*.42,playerRadius:14,damage:9});
export const isDemonSweep=kind=>kind==='coreSweepLeft'||kind==='coreSweepRight';
export const demonSweepSide=kind=>kind==='coreSweepLeft'?1:-1; // anatomical left is screen right
export function demonSweepSector(a){return {x:a.x+demonSweepSide(a.kind)*32,y:a.y+12,aim:Math.PI/2,radius:DEMON_SWEEP.radius,halfAngle:DEMON_SWEEP.halfAngle};}
function rayDistance(x,y,angle){const dx=Math.cos(angle),dy=Math.sin(angle),t=Math.max(0,Math.min(DEMON_SWEEP.radius,x*dx+y*dy));return Math.hypot(x-dx*t,y-dy*t);}
export function demonSweepIntersects(a,p){
 if(!isDemonSweep(a.kind))return false;
 const s=demonSweepSector(a),x=p.x-s.x,y=p.y-s.y,d=Math.hypot(x,y),delta=Math.atan2(Math.sin(Math.atan2(y,x)-s.aim),Math.cos(Math.atan2(y,x)-s.aim));
 const gap=Math.abs(delta)<=s.halfAngle?Math.max(0,d-s.radius):Math.min(rayDistance(x,y,s.aim-s.halfAngle),rayDistance(x,y,s.aim+s.halfAngle));
 return gap<=DEMON_SWEEP.playerRadius;
}
