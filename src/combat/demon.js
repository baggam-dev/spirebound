import {blocked,moveBody,safeSpawn,segmentBlocked,steering} from '../world/terrain.js';
import {emitShot} from './patterns.js';
import {runRandom} from '../game/random.js';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const segmentDistance=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy,t=length?clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/length,0,1):0;return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);};
const parts={
 1:[['hand',285,255,3300],['foot',675,255,3800]],
 2:[['eye',260,180,2700],['nose',675,270,3200],['mouth',420,390,3400]],
 3:[['core',480,145,8500]]
};
const names={hand:'기어가는 손',foot:'뛰는 발',eye:'박쥐의 눈',nose:'멧돼지의 코',mouth:'거미의 입',core:'벽 너머 대악마'};
export const demonPartName=part=>names[part]||'대악마';
function spawn(r,phase){r.enemies=parts[phase].map(([part,x,y,hp],id)=>({id,type:'boss',variant:'demon',part,x,y,hp,max:hp,cd:1,tier:9,balanceVersion:1,bossHealthVersion:1,bossPowerVersion:18}));r.nextEnemyId=r.enemies.length;r.bossTotalHp=r.enemies.reduce((n,e)=>n+e.max,0);}
export function challengeDemon(s){const r=s.floors[s.floor][s.room];if(s.campaign!=='expanded'||s.floor!==9||s.key||!r.demonPending||r.enemies.length)return false;r.demonPending=false;r.demon={phase:1,turn:0,attackClock:1.8,attack:null,recovery:0,handFinger:0,footTurn:0,eyeTurn:0,mouthTurn:0,lastCore:null,trails:[]};spawn(r,1);s.entryGrace=1;return true;}
export function resetDemonAttack(r){if(!r.demon)return;r.demon.attack=null;r.demon.force=null;r.demon.trails=[];r.demon.attackClock=Math.max(1,r.demon.attackClock);r.demon.recovery=0;}
export function advanceDemonPhase(r,bullets){
 const d=r.demon;if(!d||r.enemies.some(e=>e.variant==='demon'&&e.hp>0)||d.phase>=3)return false;
 d.phase++;d.attack=null;d.force=null;d.attackClock=1.6;d.recovery=1.2;d.trails=[];
 r.obstacles=r.obstacles.filter(o=>!o.demonHole);
 for(const b of bullets)if(b.enemy)b.life=0;
 spawn(r,d.phase);return true;
}
function routeOpen(obstacles,p,targets){
 const step=30,key=(x,y)=>`${x},${y}`,start={x:clamp(Math.round(p.x/step),2,30),y:clamp(Math.round(p.y/step),2,16)};
 const free=(x,y)=>x>=2&&x<=30&&y>=2&&y<=16&&!blocked(x*step,y*step,22,obstacles);
 if(!free(start.x,start.y))return false;
 const queue=[start],seen=new Set([key(start.x,start.y)]);
 for(let i=0;i<queue.length;i++)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=queue[i].x+dx,y=queue[i].y+dy,k=key(x,y);if(!seen.has(k)&&free(x,y)){seen.add(k);queue.push({x,y});}}
 return targets.every(t=>{const x=clamp(Math.round(t.x/step),2,30),y=clamp(Math.round(t.y/step),2,16);return seen.has(key(x,y));});
}
export function tryDemonHole(r,x,y,p){
 if(!r.demon||r.demon.phase!==1)return false;
 const hole={x:clamp(Math.round(x-27),95,805),y:clamp(Math.round(y-27),105,385),w:54,h:54,type:'rock',demonHole:true};
 const center={x:hole.x+27,y:hole.y+27};
 if(dist(center,p)<85||[[55,270],[480,63],[480,477]].some(([x,y])=>dist(center,{x,y})<125))return false;
 const existing=r.obstacles.filter(o=>o.demonHole),others=r.obstacles.filter(o=>!o.demonHole);
 if(blocked(center.x,center.y,55,others))return false;
 const keep=existing.slice(-1),next=[...others,...keep,hole],targets=[{x:60,y:270},...r.enemies.filter(e=>e.hp>0&&dist(e,center)>75).map(e=>({x:e.x,y:e.y}))];
 if(next.length>30||!routeOpen(next,p,targets))return false;
 r.obstacles=next;return true;
}
function shot(owner,angle,bullets,speed=230,damage=9){emitShot(owner,angle,speed,bullets);const b=bullets.at(-1);b.damage=damage;b.source=demonPartName(owner.part)+' 탄환';b.demonShot=true;}
function handAttack(owner,a,bullets){
 const finger=a.finger;
 if(finger===0)for(const offset of [-.38,-.19,0,.19,.38])shot(owner,a.aim+offset,bullets,210);
 if(finger===1)for(const offset of [-.07,0,.07])shot(owner,a.aim+offset,bullets,285);
 if(finger===2)for(const offset of [-.12,0,.12])shot(owner,a.aim+offset,bullets,170,12);
 if(finger===3)for(const offset of [-.3,0,.3]){shot(owner,a.aim+offset,bullets,210);bullets.at(-1).demonCurve=offset<0?-.6:offset>0?.6:0;}
 if(finger===4)for(let i=-3;i<=3;i++)shot(owner,a.aim+i*.18,bullets,180,7);
}
function living(r,part){return r.enemies.find(e=>e.variant==='demon'&&e.part===part&&e.hp>0);}
function chooseAttack(s,r,p){
 const d=r.demon,available=r.enemies.filter(e=>e.variant==='demon'&&e.hp>0);if(!available.length)return;
 let owner,kind;
 if(d.phase===1){owner=available[d.turn%available.length];kind=owner.part==='hand'?'hand':d.footTurn++%2?'footDash':'footJump';}
 else if(d.phase===2){owner=available[d.turn%available.length];kind=owner.part==='eye'?(d.eyeTurn++%2?'eyeOrb':'eyeRay'):owner.part==='nose'?'noseTrail':['mouthPull','mouthPush','mouthTongue'][d.mouthTurn++%3];}
 else{owner=available[0];const options=['hand','footJump','eyeRay','noseTrail','mouthPull','mouthTongue'].filter(k=>k!==d.lastCore);kind=options[Math.floor(runRandom(s)*options.length)];d.lastCore=kind;}
 d.turn++;const target={x:clamp(p.x,115,845),y:clamp(p.y,100,440)};
 const a={kind,owner:owner.part,time:kind==='footJump'||kind==='eyeRay'?1.1:.85,x:owner.x,y:owner.y,tx:target.x,ty:target.y,aim:Math.atan2(p.y-owner.y,p.x-owner.x)};
 if(kind==='hand'){a.finger=d.handFinger;d.handFinger=(d.handFinger+1)%5;}
 if(kind==='noseTrail'){a.tx=clamp(p.x+(p.x>owner.x?110:-110),135,825);a.ty=clamp(p.y,110,430);}
 d.attack=a;
}
function trailHit(d,p,hurt){for(const t of d.trails)if(t.time>0&&dist(t,p)<t.radius)hurt(9,'대악마 독길');}
function resolve(s,r,p,bullets,hurt){
 const d=r.demon,a=d.attack,owner=living(r,a.owner);if(!owner){d.attack=null;d.attackClock=.7;return;}
 if(a.kind==='hand')handAttack(owner,a,bullets);
 if(a.kind==='footJump'){
  if(d.phase===1){owner.x=a.tx;owner.y=a.ty;safeSpawn(owner,r.obstacles,32);}
  if(dist({x:a.tx,y:a.ty},p)<95&&!segmentBlocked({x:a.tx,y:a.ty},p,r.obstacles))hurt(18,'대악마 발 착지');
  if(d.phase===1&&tryDemonHole(r,a.tx,a.ty,p))safeSpawn(owner,r.obstacles,32);
 }
 if(a.kind==='footDash'){
  const start={x:owner.x,y:owner.y},end={x:a.tx,y:a.ty};if(!segmentBlocked(start,end,r.obstacles,32)){owner.x=end.x;owner.y=end.y;if(segmentDistance(p,start,end)<42)hurt(9,'대악마 발 돌진');}
 }
 if(a.kind==='eyeRay'){
  for(const offset of [-.22,0,.22]){const angle=a.aim+offset;if(Math.abs(Math.sin(angle)*(p.x-a.x)-Math.cos(angle)*(p.y-a.y))<15&&Math.cos(angle)*(p.x-a.x)+Math.sin(angle)*(p.y-a.y)>0&&!segmentBlocked({x:a.x,y:a.y},p,r.obstacles,2)){hurt(9,'대악마 눈 광선');break;}}
 }
 if(a.kind==='eyeOrb')for(const offset of [-.25,0,.25])shot(owner,a.aim+offset,bullets,240);
 if(a.kind==='noseTrail'){
  const count=6;for(let i=0;i<count;i++){const t=i/(count-1),x=a.x+(a.tx-a.x)*t,y=a.y+(a.ty-a.y)*t;if(!blocked(x,y,24,r.obstacles))d.trails.push({x,y,radius:34,time:4});}
  if(d.phase===2){owner.x=a.tx;owner.y=a.ty;safeSpawn(owner,r.obstacles,32);}d.trails=d.trails.slice(-12);
 }
 if(a.kind==='mouthPull'||a.kind==='mouthPush'){d.trails=[];d.force={kind:a.kind,x:owner.x,y:owner.y,time:.8};}
 if(a.kind==='mouthTongue'&&dist(owner,p)<155&&Math.abs(Math.atan2(Math.sin(Math.atan2(p.y-owner.y,p.x-owner.x)-a.aim),Math.cos(Math.atan2(p.y-owner.y,p.x-owner.x)-a.aim)))<.7&&!segmentBlocked(owner,p,r.obstacles))hurt(9,'대악마 혀 공격');
 d.attack=null;d.attackClock=d.phase===3?1.8:2.1;d.recovery=d.force?.time||.55;
}
export function updateDemon(s,r,p,dt,bullets,hurt){
 const d=r.demon;if(!d||!r.enemies.some(e=>e.variant==='demon'&&e.hp>0))return;
 for(const t of d.trails)t.time=Math.max(0,t.time-dt);d.trails=d.trails.filter(t=>t.time>0);trailHit(d,p,hurt);
 if(d.phase===2&&!living(r,'nose'))d.trails=[];
 if(d.force){const f=d.force,angle=Math.atan2(f.y-p.y,f.x-p.x),sign=f.kind==='mouthPull'?1:-1;if(dist(f,p)<270)moveBody(p,Math.cos(angle)*110*sign*dt,Math.sin(angle)*110*sign*dt,r.obstacles,14);f.time=Math.max(0,f.time-dt);if(!f.time)d.force=null;}
 for(const e of r.enemies)if(e.hp>0&&e.variant==='demon'&&d.attack?.owner!==e.part){
  let target,speed=0;if(e.part==='hand'&&dist(e,p)>170){target=p;speed=34;}if(e.part==='mouth'&&dist(e,p)>210){target=p;speed=20;}
  if(e.part==='nose'){target={x:p.x>480?220:740,y:p.y>270?150:390};speed=48;}
  if(target){const angle=steering(e,target,r.obstacles,32);moveBody(e,Math.cos(angle)*speed*dt,Math.sin(angle)*speed*dt,r.obstacles,32);e.x=clamp(e.x,65,895);e.y=clamp(e.y,80,460);}
 }
 if(d.recovery>0){d.recovery=Math.max(0,d.recovery-dt);return;}
 if(d.attack){d.attack.time=Math.max(0,d.attack.time-dt);if(!d.attack.time)resolve(s,r,p,bullets,hurt);return;}
 d.attackClock=Math.max(0,d.attackClock-dt);if(!d.attackClock)chooseAttack(s,r,p);
}
