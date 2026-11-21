import {movementSlowFactor} from './frost.js';
import {moveBody,steering,segmentBlocked} from '../world/terrain.js';
import {meleeIntersects} from './enemy-melee.js';

export const PURSUER=Object.freeze({radius:30,height:88,xp:90,walk:42,warning:.9,dash:.5,distance:210,cleaveWarning:.6,cleave:.22,reach:90,halfAngle:1,recover:1.7});
const bounds={minX:60,maxX:900,minY:75,maxY:465};
export function resetPursuerAttack(e){if(e.type!=='pursuer')return;delete e.attackPhase;delete e.attackTime;delete e.pursuerFromX;delete e.pursuerFromY;delete e.pursuerToX;delete e.pursuerToY;delete e.dashHit;delete e.cleaveHit;e.cd=Math.max(1.2,e.cd||0);}
function phase(e,name,time){e.attackPhase=name;e.attackTime=time;}
function prepareCleave(e,p){e.aim=Math.atan2(p.y-e.y,p.x-e.x);e.cleaveHit=false;phase(e,'cleaveWarning',PURSUER.cleaveWarning);}
function swept(a,b,p){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(a.x+dx*t-p.x,a.y+dy*t-p.y)<=PURSUER.radius+14;}
export function updatePursuer(e,p,room,dt,hurt){
 if(e.type!=='pursuer'||e.hp<=0||!(dt>0))return;
 if(!e.attackPhase){
  e.cd=Math.max(0,(e.cd??1.2)-dt);const distance=Math.hypot(p.x-e.x,p.y-e.y);
  if(e.cd===0&&distance<=350&&!segmentBlocked(e,p,room.obstacles,PURSUER.radius)){
   if(distance<=105){prepareCleave(e,p);return;}
   e.aim=Math.atan2(p.y-e.y,p.x-e.x);e.dashHit=false;phase(e,'warning',PURSUER.warning);return;
  }
  const aim=steering(e,p,room.obstacles,PURSUER.radius),speed=PURSUER.walk*(movementSlowFactor(e));
  moveBody(e,Math.cos(aim)*speed*dt,Math.sin(aim)*speed*dt,room.obstacles,PURSUER.radius,bounds);e.facing=aim;return;
 }
 let remaining=dt;
 for(let transitions=0;remaining>1e-9&&e.attackPhase&&transitions<8;transitions++){
  const step=Math.min(remaining,e.attackTime),current=e.attackPhase;e.attackTime=Math.max(0,e.attackTime-step);remaining-=step;
  if(current==='dash'){
   const before={x:e.x,y:e.y},distance=PURSUER.distance/PURSUER.dash*step*(movementSlowFactor(e)),next={x:e.x+Math.cos(e.aim)*distance,y:e.y+Math.sin(e.aim)*distance};
   if(segmentBlocked(before,next,room.obstacles,PURSUER.radius)||next.x<bounds.minX||next.x>bounds.maxX||next.y<bounds.minY||next.y>bounds.maxY){phase(e,'recover',2.1);break;}
   moveBody(e,next.x-e.x,next.y-e.y,room.obstacles,PURSUER.radius,bounds);
   if(!e.dashHit&&swept(before,e,p)&&!segmentBlocked(before,p,room.obstacles,1)){e.dashHit=true;hurt(9,'봉인 추적자 돌진',null,e);}
  }
  if(current==='cleave'&&!e.cleaveHit){e.cleaveHit=true;if(meleeIntersects(e,p,e.aim,PURSUER.reach,PURSUER.halfAngle,14)&&!segmentBlocked(e,p,room.obstacles,1))hurt(18,'봉인 추적자 중량 베기','pursuerHeavy',e);}
  if(e.attackTime>1e-9)break;
  if(current==='warning')phase(e,'dash',PURSUER.dash);
  else if(current==='dash'){prepareCleave(e,p);break;} // A new, visible warning before the finishing attack.
  else if(current==='cleaveWarning')phase(e,'cleave',PURSUER.cleave);
  else if(current==='cleave')phase(e,'recover',PURSUER.recover);
  else {delete e.attackPhase;delete e.attackTime;e.cd=1.1;}
 }
}
