import {moveBody,steering,segmentBlocked,safeSpawn} from './terrain.js';
import {emitShot} from './patterns.js';
import {warningCount} from './tactics.js';
export {drawUpper,drawUpperGround,drawUpperLinks} from './upper-visuals.js';
export const upperTypes=['astralSniper','gravityMage','starKnight','starBearer','royalGuard','pulseTurret','riftHunter'];
export const kingPhase=e=>e.hp/e.max>.65?1:e.hp/e.max>.3?2:3;
export const angle=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const slashReach=e=>e.variant==='king'?(kingPhase(e)>=2?165:145):155;
export const ringOffsets=Array.from({length:19},(_,i)=>(i+1)*Math.PI/10);
export const fanOffsets=(e,attack=e.darkAttack)=>e.variant==='king'?(kingPhase(e)>=2?[-.56,-.28,0,.28,.56]:[-.56,-.28,0,.28,.56].map(v=>v+(attack?.step===1?.14:0))):e.type==='astralSniper'?(e.gateTitle?[-.36,-.18,0,.18,.36]:e.escapeDepth?[-.18,0,.18]:[-.18,.18]):[-.42,0,.42];
export function judgmentStripe(a,step=a.step){return a.axis==='horizontal'?{x:30,y:110+step*100-24,w:900,h:48}:{x:180+step*200-34,y:50,w:68,h:440};}
export function pointInStripe(p,z){return p.x>=z.x&&p.x<=z.x+z.w&&p.y>=z.y&&p.y<=z.y+z.h;}
export function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,len=dx*dx+dy*dy,t=len?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/len)):0;return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
function walk(e,p,r,dt,speed){const a=steering(e,p,r.obstacles,22);moveBody(e,Math.cos(a)*speed*dt,Math.sin(a)*speed*dt,r.obstacles,22);e.x=Math.max(55,Math.min(905,e.x));e.y=Math.max(75,Math.min(465,e.y));e.facing=a;}
function shot(e,a,bullets,speed=230){emitShot(e,a,speed,bullets);const b=bullets.at(-1);b.damage=9;b.source=e.variant==='king'?'타락한 왕의 검기':'상층 암흑탄';b.dark=true;}
function ring(e,a,bullets){for(const offset of ringOffsets)shot(e,a.aim+offset,bullets,185);}
function dashEnd(e,p,r){const end={x:Math.max(60,Math.min(900,p.x)),y:Math.max(80,Math.min(460,p.y))},steps=Math.max(1,Math.ceil(dist(e,end)/5));let last={x:e.x,y:e.y};for(let i=1;i<=steps;i++){const next={x:e.x+(end.x-e.x)*i/steps,y:e.y+(end.y-e.y)*i/steps};if(segmentBlocked(last,next,r.obstacles,25)){last.blocked=true;break;}last=next;}return last;}
export function startUpperAttack(e,kind,p,r){const end=kind==='dash'?dashEnd(e,p,r):{x:p.x,y:p.y};e.darkAttack={kind,time:kind==='judgment'?1.1:kind==='slash'?.5:e.type==='astralSniper'?.6:e.variant==='king'&&kingPhase(e)>=2?.65:.85,x:e.x,y:e.y,tx:end.x,ty:end.y,aim:angle(e,p),step:0};if(kind==='dash'&&end.blocked)e.darkAttack.coverStopped=true;e.facing=e.darkAttack.aim;
 if(kind==='ring'){const a=e.darkAttack.aim+(e.escapeDepth?(e.darkTurn??0)*.45:0);e.darkAttack.aim=Math.atan2(Math.sin(a),Math.cos(a));}
 if(kind==='judgment'){e.darkAttack.axis=(e.judgmentTurn??0)%2?'horizontal':'vertical';e.judgmentTurn=((e.judgmentTurn??0)+1)%2;}
 e.lastDarkAttack=kind;e.darkTurn=(e.darkTurn??0)+1;
}
function finish(e,a){e.darkFlash={...a,time:.18};delete e.darkAttack;e.cd=e.variant==='king'?[0,.63,.36,.25][kingPhase(e)]:e.gateTitle?(e.type==='starKnight'?.585:.65):e.type==='astralSniper'?1.1:['starKnight','royalGuard','riftHunter'].includes(e.type)?1.1:1.7;e.opening=Math.max(e.opening||0,e.variant==='king'?(a.finisher?2.2:kingPhase(e)>=2?.4:.6):.35);if(a.finisher)e.kneel=2.2;if(e.gateTitle&&a.kind==='dash'&&a.coverStopped){e.opening=1.8;e.counterReason='cover';}else if(e.variant==='king'&&a.kind==='slash'&&a.step>=1&&!a.landed){e.opening=1.4;e.counterReason='evade';}}
function resolve(e,p,r,dt,bullets,hurt){const a=e.darkAttack;if(!a)return false;
 if(a.kind==='dash'&&a.moving){const before={x:e.x,y:e.y};a.elapsed=Math.min(.32,(a.elapsed||0)+dt);const t=a.elapsed/.32;e.x=a.x+(a.tx-a.x)*t;e.y=a.y+(a.ty-a.y)*t;if(!a.hit&&segmentDistance(p,before,e)<35&&!segmentBlocked(before,p,r.obstacles)){hurt(9);a.hit=true;}if(a.elapsed>=.32)finish(e,a);return true;}
 a.time=Math.max(0,a.time-dt);if(a.time>1e-9)return true;
 if(a.kind==='dash'){a.moving=true;a.elapsed=0;a.hit=false;return true;}
 const delta=Math.atan2(Math.sin(angle(e,p)-a.aim),Math.cos(angle(e,p)-a.aim));
 if(a.kind==='slash'&&dist(e,p)<slashReach(e)&&Math.abs(delta)<1.15&&!segmentBlocked(e,p,r.obstacles)){a.landed=true;hurt(9);}
 if(a.kind==='blink'){e.x=Math.max(60,Math.min(900,a.tx));e.y=Math.max(80,Math.min(460,a.ty));safeSpawn(e,r.obstacles,22);startUpperAttack(e,'slash',p,r);e.darkAttack.time=.5;return true;}
 if(a.kind==='mark'&&Math.hypot(p.x-a.tx,p.y-a.ty)<65)hurt(a.finisher?18:9);
 if(a.kind==='fan'){for(const offset of fanOffsets(e))shot(e,a.aim+offset,bullets,e.type==='astralSniper'?330:290);if(e.variant==='king'&&kingPhase(e)===1&&a.step===0){a.step=1;a.time=.28;return true;}}
 if(a.kind==='ring')ring(e,a,bullets);
 if(a.kind==='judgment'){if(pointInStripe(p,judgmentStripe(a)))hurt(18);e.darkFlash={...a,time:.18};a.step++;if(a.step<4){a.time=.65;return true;}e.darkAttack={kind:'mark',time:1.1,x:e.x,y:e.y,tx:p.x,ty:p.y,aim:angle(e,p),step:2,finisher:true};return true;}
 if(a.kind==='slash'&&(e.gateTitle||e.variant==='king'&&kingPhase(e)>=2)&&a.step<(e.variant==='king'&&kingPhase(e)===3?2:1)){e.darkFlash={...a,time:.18};a.step++;a.aim=angle(e,p);e.facing=a.aim;a.time=.5;return true;}
 finish(e,a);return true;
}
export function tickUpperState(e,p,r,dt,bullets){
 if(!(e.opening>0))delete e.counterReason;
 if(e.darkFlash){e.darkFlash.time=Math.max(0,e.darkFlash.time-dt);if(!e.darkFlash.time)delete e.darkFlash;}
 e.kneel=Math.max(0,(e.kneel||0)-dt);
 if(e.type==='starBearer'&&e.hp>0&&!(e.frozen>0))for(const n of r.enemies)if(n!==e&&n.hp>0&&dist(n,e)<170&&n.cd>0)n.cd=Math.max(0,n.cd-dt*.25);
 if(e.hp<=0||e.variant!=='king')return false;
 const phase=kingPhase(e);e.kingStage??=phase;
 if(phase>e.kingStage){e.kingStage=phase;e.kingTransition=1.4;e.cd=1;delete e.darkAttack;delete e.darkFlash;delete e.guardPortal;e.opening=0;delete e.counterReason;e.kneel=0;e.frozen=0;for(const n of r.enemies){delete n.darkAttack;delete n.darkFlash;n.cd=Math.max(1,n.cd||0);}for(const b of bullets)if(b.enemy)b.life=0;}
 if(e.kingTransition>0){for(const b of bullets)if(b.enemy)b.life=0;e.kingTransition=Math.max(0,e.kingTransition-dt);return true;}
 if(phase>=2){e.guardClock=Math.max(0,(e.guardClock??1.5)-dt);if(e.guardPortal){e.guardPortal.time=Math.max(0,e.guardPortal.time-dt);if(!e.guardPortal.time){const living=r.enemies.filter(n=>n.summoned&&n.summoner===e.id&&n.hp>0).length;if(living<2){const id=Math.max(r.nextEnemyId||0,...r.enemies.map(n=>n.id+1));r.nextEnemyId=id+1;const child={id,type:id%2?'astralSniper':'pulseTurret',x:e.guardPortal.x,y:e.guardPortal.y,hp:180,max:180,cd:1.2,tier:7,balanceVersion:1,summoned:true,summoner:e.id,spawnGrace:1};safeSpawn(child,r.obstacles,22);r.enemies.push(child);}delete e.guardPortal;}}
 if(!e.guardClock&&!e.guardPortal&&r.enemies.filter(n=>n.summoned&&n.summoner===e.id&&n.hp>0).length<2){const point={x:p.x<480?780:180,y:p.y<270?390:140};safeSpawn(point,r.obstacles,22);e.guardPortal={...point,time:1};e.guardClock=6;}}
 return false;
}
export function chooseKingAttack(e,p){const phase=kingPhase(e),near=dist(e,p)<155;let options=near?['slash','mark','dash']:['fan','dash','mark'];if(phase>=2)options.push(near?'ring':'blink');if(phase===3&&(e.darkTurn??0)%3===0&&e.lastDarkAttack!=='judgment')return 'judgment';options=options.filter(k=>k!==e.lastDarkAttack);return options[(e.darkTurn??0)%options.length];}
export function updateUpper(e,p,r,dt,bullets,hurt){
 if(e.type==='astralSniper'&&e.gateTitle){
  const a=e.darkAttack,movingTime=a?Math.min(dt,Math.max(0,a.time-.3)):dt;
  if(movingTime>0&&e.hp>0&&!(e.frozen>0)&&!(e.opening>0)){
   const distance=dist(e,p),theta=angle(p,e),side=(e.id||0)%2?1:-1;
   const target=distance>340?p:{x:Math.max(70,Math.min(890,p.x+Math.cos(theta+side*.3)*280)),y:Math.max(90,Math.min(450,p.y+Math.sin(theta+side*.3)*280))};
   walk(e,target,r,movingTime,60*(e.slow>0?(e.slowFactor??1):1));
   if(a){a.x=e.x;a.y=e.y;a.aim=angle(e,p);e.facing=a.aim;}
  }
 }
 if(resolve(e,p,r,dt,bullets,hurt))return;
 e.cd=Math.max(0,(e.cd??1)-dt*(e.gateFury?1.3:1));const slowed=e.slow>0?(e.slowFactor??1):1,ready=e.cd<=0&&warningCount(r,e)<2;
 if(e.variant==='king'){const phase=kingPhase(e);if(dist(e,p)>95)walk(e,p,r,dt,[0,60,90,110][phase]*slowed);if(ready)startUpperAttack(e,chooseKingAttack(e,p),p,r);return;}
 if(e.type==='starBearer'){walk(e,p,r,dt,20*slowed);if(ready)startUpperAttack(e,'ring',p,r);return;}
 if(e.type==='gravityMage'&&e.escapeDepth){if(ready)startUpperAttack(e,'ring',p,r);return;}
 if(e.type==='gravityMage'){if(ready){e.gravity={x:p.x,y:p.y,time:2.2};e.cd=2.8;}if(e.gravity){const g=e.gravity;g.time=Math.max(0,g.time-dt);if(g.time<1.7&&dist(p,g)<115){const a=angle(p,g);moveBody(p,Math.cos(a)*85*dt,Math.sin(a)*85*dt,r.obstacles,14);}if(!g.time)delete e.gravity;}return;}
 if(['starKnight','royalGuard','riftHunter'].includes(e.type))walk(e,p,r,dt,(e.gateTitle?96.8:78)*slowed);
 if(ready&&e.gateTitle){startUpperAttack(e,e.type==='starKnight'?((e.darkTurn??0)%2?'dash':'slash'):((e.darkTurn??0)%3===2?'ring':'fan'),p,r);return;}
 if(ready)startUpperAttack(e,e.type==='astralSniper'?'fan':e.type==='pulseTurret'?'ring':e.type==='riftHunter'?'blink':'slash',p,r);
}
export function challengeKing(s){const r=s.floors[s.floor][s.room];if(s.key||!r.kingPending||r.enemies.length)return false;r.kingPending=false;r.enemies=[{id:0,type:'boss',variant:'king',x:480,y:180,hp:11700,max:11700,cd:1.5,tier:7,balanceVersion:1,bossHealthVersion:1,bossPowerVersion:18,kingStage:1}];s.entryGrace=1;return true;}
