import {moveBody,segmentBlocked} from '../world/terrain.js';
export const enhancedWarden=e=>e.type==='boss'&&(!e.variant||e.variant==='warden')&&e.tier===1;
export const WARDEN_ATTACKS=Object.freeze({speed:44,slamWarning:.9,slashRadius:75,halfAngle:Math.PI/3,slashWarning:.38,chargeWarning:.55,chargeSpeed:360,chargeDuration:.5});
export function wardenSlashHits(e,p,obstacles){
 const {slashRadius:radius,halfAngle}=WARDEN_ATTACKS,dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy),delta=Math.atan2(Math.sin(Math.atan2(dy,dx)-e.patternAim),Math.cos(Math.atan2(dy,dx)-e.patternAim));
 const ray=a=>{const t=Math.max(0,Math.min(radius,dx*Math.cos(a)+dy*Math.sin(a)));return Math.hypot(dx-Math.cos(a)*t,dy-Math.sin(a)*t);};
 const gap=Math.abs(delta)<=halfAngle?Math.max(0,d-radius):Math.min(ray(e.patternAim-halfAngle),ray(e.patternAim+halfAngle));
 return gap<=14&&!segmentBlocked(e,p,obstacles,0);
}
export function startWardenMelee(e,p){
 const d=Math.hypot(p.x-e.x,p.y-e.y);
 const pattern=d<=90&&!(e.wardenSlashCd>0)?'cleave':d>=140&&d<=360&&!(e.wardenChargeCd>0)?'charge':null;
 if(!pattern)return false;
 e.pattern=pattern;e.attackPhase='warning';e.patternAim=Math.atan2(p.y-e.y,p.x-e.x);e.attackTime=pattern==='cleave'?WARDEN_ATTACKS.slashWarning:WARDEN_ATTACKS.chargeWarning;e.warningDuration=e.attackTime;e.wardenHit=false;
 if(pattern==='cleave')e.wardenSlashCd=4;else e.wardenChargeCd=6;
 return true;
}
// Returns null for the existing ranged/jump pattern state machine, including recovery.
export function updateWardenMelee(e,p,obstacles,dt){
 if(!['cleave','charge'].includes(e.pattern)||!e.attackPhase||e.attackPhase==='recover')return null;
 e.attackTime=Math.max(0,e.attackTime-dt);
 if(e.attackPhase==='warning'){
  if(e.attackTime>0)return 0;
  if(e.pattern==='cleave'){e.attackPhase='firing';e.attackTime=.12;return wardenSlashHits(e,p,obstacles)?18:0;}
  e.attackPhase='dash';e.attackTime=WARDEN_ATTACKS.chargeDuration;return 0;
 }
 if(e.attackPhase==='firing'){
  if(e.attackTime<=0){e.attackPhase='recover';e.attackTime=.85;}return 0;
 }
 if(e.attackPhase==='dash'){
  const before={x:e.x,y:e.y},dx=Math.cos(e.patternAim)*WARDEN_ATTACKS.chargeSpeed*dt,dy=Math.sin(e.patternAim)*WARDEN_ATTACKS.chargeSpeed*dt;
  const blocked=segmentBlocked(before,{x:e.x+dx,y:e.y+dy},obstacles,32);moveBody(e,dx,dy,obstacles,32);
  const hit=!e.wardenHit&&segmentDistance(p,before,e)<=46&&!segmentBlocked(e,p,obstacles,0);if(hit)e.wardenHit=true;
  if(blocked||e.attackTime<=0){e.attackPhase='recover';e.attackTime=1;}
  return hit?18:0;
 }
 return 0;
}
function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,n=dx*dx+dy*dy,t=n?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/n)):0;return Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t);}
