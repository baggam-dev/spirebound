import {highFloorEnemy,highFloorKinds,highShapes,highRecovery,highAttackStartAllowed} from './high-floor-profile.js';
import {blocked,segmentBlocked,moveBody,steering} from '../world/terrain.js';
import {seekEnemyShot,clearEnemyShot} from './enemy-sightline.js';
import {meleeIntersects} from './enemy-melee.js';
import {emitShot} from './patterns.js';
import {warningCount} from './tactics.js';
import {frostAttackRate} from './frost.js';
import {enemyMovementGoal} from '../world/enemy-movement-goals.js';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),angle=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x),clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const point=(x,y)=>({x:clamp(x,62,898),y:clamp(y,78,462)});
const bodyRadius=e=>e.type==='demonSoldier'?19:e.type==='demonCaptain'?24:22;
const boundsFor=e=>e.type==='demonCaptain'?{minX:50,maxX:910,minY:65,maxY:475}:e.type==='demonSoldier'?{minX:45,maxX:915,minY:60,maxY:480}:{minX:55,maxX:905,minY:75,maxY:465};
export function highStepEnd(e,aim,length,obstacles){const b=boundsFor(e);let last={x:e.x,y:e.y};for(let d=0;d<length;){d=Math.min(length,d+4);const next={x:e.x+Math.cos(aim)*d,y:e.y+Math.sin(aim)*d};if(next.x<b.minX||next.x>b.maxX||next.y<b.minY||next.y>b.maxY||segmentBlocked(last,next,obstacles,bodyRadius(e)))break;last=next;}return last;}
function walk(e,target,room,dt,speed){const radius=bodyRadius(e),a=steering(e,target,room.obstacles,radius),step=Math.min(dist(e,target),speed*dt*(e.slow>0?(e.slowFactor??1):1));moveBody(e,Math.cos(a)*step,Math.sin(a)*step,room.obstacles,radius,boundsFor(e));e.facing=a;}
function phase(a,stage,time){a.stage=stage;a.time=time;a.duration=time;}
function flash(e,a){e.highFlash={...a,time:.18};}
function recover(e,a,time=highRecovery[a.kind]??.7){if(['twoShot','cross','resonate'].includes(a.kind))flash(e,a);phase(a,'recover',time);}
function landingOccupied(e,q,room){return room.enemies.some(n=>n!==e&&n.hp>0&&dist(n,q)<22+bodyRadius(n)+8);}
function shoot(e,target,room,bullets,speed=330){if(segmentBlocked(e,target,room.obstacles,4))return;emitShot(e,angle(e,target),speed,bullets);const b=bullets.at(-1);b.damage=9;b.dark=true;}
function hit(e,p,room,a,hurt){const shape=highShapes[a.kind];if(!shape||segmentBlocked(e,p,room.obstacles))return;
 if(shape.width){const dx=p.x-e.x,dy=p.y-e.y,t=clamp(dx*Math.cos(a.aim)+dy*Math.sin(a.aim),0,shape.range);if(Math.hypot(dx-Math.cos(a.aim)*t,dy-Math.sin(a.aim)*t)<=shape.width+14)hurt(shape.damage);}
 else if(meleeIntersects(e,p,a.aim,shape.range,shape.half))hurt(shape.damage);
}
export function cancelHighAttack(e){if(e.highAttack){delete e.highAttack;e.cd=Math.max(.8,e.cd||0);}delete e.highFlash;}
export function tickHighState(e,dt){if(e.highFlash){e.highFlash.time=Math.max(0,e.highFlash.time-dt);if(!e.highFlash.time)delete e.highFlash;}if(e.hp<=0||e.frozen>0||e.opening>0)cancelHighAttack(e);}
function start(e,p,room){
 const kind=e.type==='royalGuard'&&dist(e,p)<52?'butt':highFloorKinds[e.type],aim=angle(e,p),move=p.lastMove||{x:0,y:0},n=Math.max(1,Math.hypot(move.x,move.y)),second=point(p.x+move.x/n*64,p.y+move.y/n*64);
 const a={kind,stage:'windup',time:.3,duration:.3,aim,x:e.x,y:e.y,tx:p.x,ty:p.y,homeX:e.x,homeY:e.y,secondX:second.x,secondY:second.y,step:0,hit:false,close:dist(e,p)<90};
 if(kind==='guard')phase(a,'advance',.3);
 if(kind==='butt')phase(a,'windup',.2);
 if(kind==='soldier')phase(a,'windup',.25);
 if(kind==='twoShot'||kind==='gravity')phase(a,'windup',.65);
 if(kind==='resonate')phase(a,'windup',.6);
 if(kind==='cross')phase(a,'windup',.7);
 if(kind==='captain'){phase(a,'windup',a.close?.3:.75);const end=highStepEnd(e,aim,255*.42,room.obstacles);a.tx=end.x;a.ty=end.y;}
 if(kind==='rift'){
  const theta=angle(p,e),side=e.id%2?1:-1;let landing;
  for(const turn of [side*Math.PI/2,-side*Math.PI/2,0]){const q=point(p.x+Math.cos(theta+turn)*92,p.y+Math.sin(theta+turn)*92);if(dist(q,p)>=70&&!landingOccupied(e,q,room)&&!blocked(q.x,q.y,22,room.obstacles)&&!segmentBlocked(e,q,room.obstacles,22)&&!segmentBlocked(q,p,room.obstacles)){landing=q;break;}}
  if(!landing){e.cd=.3;return;}a.tx=landing.x;a.ty=landing.y;phase(a,'windup',.45);
 }
 e.highAttack=a;e.facing=aim;
}
function advance(e,p,room,dt,bullets,hurt){
 const a=e.highAttack,clock=dt*frostAttackRate(e),active=Math.min(a.time,clock);
 if(a.stage==='advance'){const end=highStepEnd(e,a.aim,80*active,room.obstacles);e.x=end.x;e.y=end.y;}
 if(a.kind==='soldier'&&a.stage==='strike'){const end=highStepEnd(e,a.aim,24*active/.12,room.obstacles);e.x=end.x;e.y=end.y;}
 if(a.stage==='dash'){
  const before={x:e.x,y:e.y},dx=a.tx-e.x,dy=a.ty-e.y,length=Math.hypot(dx,dy),step=Math.min(length,255*active);if(length)moveBody(e,dx/length*step,dy/length*step,room.obstacles,bodyRadius(e),boundsFor(e));
  const vx=e.x-before.x,vy=e.y-before.y,t=clamp(((p.x-before.x)*vx+(p.y-before.y)*vy)/(vx*vx+vy*vy||1),0,1);
  if(!a.hit&&Math.hypot(p.x-before.x-vx*t,p.y-before.y-vy*t)<40&&!segmentBlocked(before,p,room.obstacles)){hurt(18);a.hit=true;}
 }
 if(a.kind==='gravity'&&a.stage==='channel'&&dist(p,{x:a.tx,y:a.ty})<90){
  const earlier=room.enemies.some(n=>n!==e&&n.hp>0&&!(n.frozen>0)&&n.id<e.id&&n.highAttack?.kind==='gravity'&&n.highAttack.stage==='channel'&&dist(p,{x:n.highAttack.tx,y:n.highAttack.ty})<90);
  if(!earlier){const theta=Math.atan2(a.ty-p.y,a.tx-p.x),step=Math.min(45*active,dist(p,{x:a.tx,y:a.ty}));moveBody(p,Math.cos(theta)*step,Math.sin(theta)*step,room.obstacles,14);}
 }
 a.time=Math.max(0,a.time-clock);if(a.time>1e-9)return;
 if(a.stage==='recover'){delete e.highAttack;e.cd=a.kind==='gravity'?2.8:a.kind==='captain'?2.3:a.kind==='twoShot'?1.6:a.kind==='resonate'?2.4:1.4;return;}
 if(a.stage==='advance'){phase(a,'windup',.3);a.x=e.x;a.y=e.y;return;}
 if(a.stage==='dash'){a.aim=angle(e,p);e.facing=a.aim;phase(a,'windup2',.4);return;}
 if(a.stage==='return'){const home={x:a.homeX,y:a.homeY};if(!blocked(home.x,home.y,22,room.obstacles)&&!landingOccupied(e,home,room)){e.x=home.x;e.y=home.y;}recover(e,a);return;}
 if(a.stage==='channel'){recover(e,a,highRecovery[a.kind]??.6);return;}
 if(a.stage==='strike'){
  if(a.kind==='soldier'){hit(e,p,room,a,hurt);flash(e,a);}
  if(a.kind==='rift'){phase(a,'return',.35);return;}
  phase(a,'recover',highRecovery[a.kind]??.7);return;
 }
 if(a.kind==='twoShot'){
  shoot(e,{x:a.stage==='windup'?a.tx:a.secondX,y:a.stage==='windup'?a.ty:a.secondY},room,bullets);
  if(a.stage==='windup'){a.step=1;phase(a,'windup2',.3);}else recover(e,a);return;
 }
 if(a.kind==='cross'){
  const theta=a.aim+(a.step?Math.PI/4:0);for(let i=0;i<4;i++)shoot(e,{x:e.x+Math.cos(theta+i*Math.PI/2)*480,y:e.y+Math.sin(theta+i*Math.PI/2)*480},room,bullets,185);
  if(!a.step){a.step=1;phase(a,'windup2',.65);}else recover(e,a);return;
 }
 if(a.kind==='gravity'){phase(a,'channel',.8);return;}
 if(a.kind==='resonate'){
  for(const n of room.enemies)if(n!==e&&n.hp>0&&n.type!=='boss'&&!n.gateTitle&&dist(n,e)<170&&n.cd>.45)n.cd=Math.max(.45,n.cd-.35);
  flash(e,a);phase(a,'channel',.18);return;
 }
 if(a.kind==='rift'&&a.stage==='windup'){
  if(landingOccupied(e,{x:a.tx,y:a.ty},room)||blocked(a.tx,a.ty,22,room.obstacles)||segmentBlocked(e,{x:a.tx,y:a.ty},room.obstacles,22)){cancelHighAttack(e);return;}
  e.x=a.tx;e.y=a.ty;a.aim=angle(e,p);e.facing=a.aim;phase(a,'windup2',.25);return;
 }
 if(a.kind==='captain'&&!a.close&&a.stage==='windup'){phase(a,'dash',.42);return;}
 if(a.kind!=='soldier'){hit(e,p,room,a,hurt);flash(e,a);}phase(a,'strike',.12);
}
// False lets an old saved attack finish through its original controller unchanged.
export function updateHighFloorEnemy(e,p,room,dt,bullets,hurt){
 if(!highFloorEnemy(e))return false;
 if(e.highAttack){advance(e,p,room,dt,bullets,hurt);return true;}
 if(e.darkAttack||e.gravity||e.meleeAttack||e.phase||e.attackPhase)return false;
 if(e.eliteWarning>0)return true;
 if(e.meleeCooldown>0){e.meleeCooldown=Math.max(0,e.meleeCooldown-dt*frostAttackRate(e));return true;}
 e.cd=Math.max(0,(e.cd??1)-dt);
 const kind=highFloorKinds[e.type],gap=dist(e,p),ready=e.cd<=0&&warningCount(room,e)<2&&highAttackStartAllowed(e,p,room);
 if(['twoShot','gravity'].includes(kind)&&!clearEnemyShot(e,p,room.obstacles,kind==='twoShot'?480:400)){
  seekEnemyShot(e,p,room.obstacles,dt,{radius:22,speed:kind==='twoShot'?34:28,preferred:270});return true;
 }
 if(kind==='twoShot'||kind==='gravity'){
  const group=enemyMovementGoal(e,p);
  if(ready)start(e,p,room);else if(group?.positioned&&dist(e,group.target)>12)walk(e,group.target,room,dt,kind==='twoShot'?34:28);else if(gap<170||gap>350)walk(e,point(p.x+(e.x-p.x)/(gap||1)*270,p.y+(e.y-p.y)/(gap||1)*270),room,dt,kind==='twoShot'?34:28);return true;
 }
 if(kind==='resonate'){walk(e,p,room,dt,20);if(ready)start(e,p,room);return true;}
 if(kind==='cross'){if(ready)start(e,p,room);return true;}
 const range=kind==='guard'?130:kind==='thrust'?149:kind==='rift'?380:kind==='soldier'?96:260;
 if(ready&&gap<=range&&!segmentBlocked(e,p,room.obstacles)){start(e,p,room);return true;}
 walk(e,p,room,dt,kind==='soldier'?68:kind==='captain'?82:78);return true;
}
