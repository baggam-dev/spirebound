import {SKELETON,isSkeleton} from './skeleton-profile.js';
import {movementSlowFactor,frostAttackRate} from './frost.js';
import {moveBody,steering,segmentBlocked} from '../world/terrain.js';
import {meleeIntersects} from './enemy-melee.js';
import {warningCount} from './tactics.js';
import {enemyMovementGoal} from '../world/enemy-movement-goals.js';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),bounds={minX:55,maxX:905,minY:75,maxY:465};
function recover(e,a){a.stage='recover';a.time=a.kind==='dash'?.8:e.type==='skeletonWarrior'?.5:.22;e.cd=e.type==='skeletonWarrior'?.65:.45;}
function shoot(e,r,bullets,aim,bounce=false){
 if(bullets.filter(b=>b.life>0&&b.skeletonShot&&b.skeletonOwner===e.summoner).length>=SKELETON.projectileCap)return;
 const from={x:e.x+Math.cos(aim)*19,y:e.y+Math.sin(aim)*19};if(segmentBlocked(e,from,r.obstacles,4))return;
 bullets.push({...from,vx:Math.cos(aim)*300,vy:Math.sin(aim)*300,enemy:true,skeletonShot:true,skeletonOwner:e.summoner,source:'해골 궁수 '+(bounce?'반사탄':'뼈 화살'),damage:10,life:2.8,hit:[],...(bounce?{ricochet:true,bounces:1}:{})});
}
export function updateSkeleton(e,p,r,dt,bullets,hurt,random=Math.random){
 if(!isSkeleton(e))return false;
 e.skeletonMoving=false;const a=e.skeletonAttack;
 if(!a&&e.eliteWarning>0)return true;
 if(a){
  const beforeTime=a.time,rate=frostAttackRate(e);let activeDt=a.stage==='active'?Math.min(dt,beforeTime/Math.max(.05,rate)):dt;a.time=Math.max(0,a.time-dt*rate);
  if(a.stage==='recover'){if(!a.time)delete e.skeletonAttack;return true;}
  if(a.stage==='windup'){
   if(a.time>0)return true;
   if(segmentBlocked(e,p,r.obstacles,3)){recover(e,a);return true;}
   activeDt=Math.max(0,dt-beforeTime/Math.max(.05,rate));a.stage='active';a.time=Math.max(0,(a.kind==='dash'?SKELETON.dashDuration:a.kind==='burst'?.32:.12)-activeDt*rate);a.hit=false;a.shots=0;a.elapsed=0;
  }
  if(a.stage==='active'){
   if(a.kind==='dash'){
    const before={x:e.x,y:e.y},travel=SKELETON.dashSpeed*activeDt*movementSlowFactor(e);moveBody(e,Math.cos(a.aim)*travel,Math.sin(a.aim)*travel,r.obstacles,18,bounds);
    const dx=e.x-before.x,dy=e.y-before.y,t=Math.max(0,Math.min(1,((p.x-before.x)*dx+(p.y-before.y)*dy)/(dx*dx+dy*dy||1))),near={x:before.x+dx*t,y:before.y+dy*t};
    if(!a.hit&&distance(near,p)<SKELETON.dashRadius&&!segmentBlocked(near,p,r.obstacles,2)){hurt(18,'해골 전사 대시 베기',null,e);a.hit=true;}
    if(distance(before,e)<travel*.2)a.time=0;
   }else if(a.kind==='slash'){
    if(!a.hit&&meleeIntersects(e,p,a.aim,SKELETON.slashRange,SKELETON.slashHalfAngle)&&!segmentBlocked(e,p,r.obstacles,2)){hurt(18,'해골 전사 베기',null,e);a.hit=true;}
   }else if(a.kind==='burst'){
    a.elapsed+=activeDt*rate;while(a.shots<3&&a.elapsed>=a.shots*.12){shoot(e,r,bullets,a.aim);a.shots++;}
   }else if(!a.shots){for(const offset of a.kind==='fan'?[-.3,-.15,0,.15,.3]:[0])shoot(e,r,bullets,a.aim+offset,a.kind==='ricochet');a.shots=1;}
   if(a.time===0)recover(e,a);
  }
  return true;
 }
 e.cd=Math.max(0,(e.cd||0)-dt);e.skeletonDashClock=Math.max(0,(e.skeletonDashClock||0)-dt*frostAttackRate(e));
 const dist=distance(e,p),clear=!segmentBlocked(e,p,r.obstacles,4),warrior=e.type==='skeletonWarrior';
 if(clear&&e.cd===0&&warningCount(r,e)<2&&(warrior?dist<78||dist>110&&dist<330&&e.skeletonDashClock===0:dist<520)){
  let kind;if(warrior){kind=dist<78?'slash':'dash';if(kind==='dash')e.skeletonDashClock=4;}
  else{const options=['fan','ricochet','burst'].filter(k=>e.skeletonPatternRepeats<2||k!==e.skeletonLastPattern);kind=options[Math.min(options.length-1,Math.floor(random()*options.length))];e.skeletonPatternRepeats=kind===e.skeletonLastPattern?(e.skeletonPatternRepeats||1)+1:1;e.skeletonLastPattern=kind;}
  e.skeletonAttack={kind,stage:'windup',time:kind==='dash'?.55:warrior?.38:.35,aim:Math.atan2(p.y-e.y,p.x-e.x)};e.facing=e.skeletonAttack.aim;return true;
 }
 let target=enemyMovementGoal(e,p)?.target||p;if(!warrior&&clear&&dist<200)target={x:e.x+(e.x-p.x),y:e.y+(e.y-p.y)};
 if(warrior?dist>55:!clear||dist<200||dist>330){const angle=steering(e,target,r.obstacles,18),speed=(warrior?SKELETON.warriorSpeed:SKELETON.archerSpeed)*movementSlowFactor(e);moveBody(e,Math.cos(angle)*speed*dt,Math.sin(angle)*speed*dt,r.obstacles,18,bounds);e.facing=angle;e.skeletonMoving=true;e.skeletonWalk=(e.skeletonWalk||0)+dt;}
 return true;
}
