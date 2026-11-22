import {moveBody,steering,segmentBlocked,safeSpawn} from '../world/terrain.js';
import {movementSlowFactor,frostAttackRate} from './frost.js';
import {emitShot} from './patterns.js';
import {meleeIntersects} from './enemy-melee.js';
import {REMNANT_NAMES} from '../world/remnant-hunt.js';

const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const aim=(e,p)=>Math.atan2(p.y-e.y,p.x-e.x);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function shoot(e,angle,bullets,speed=245){emitShot(e,angle,speed,bullets);Object.assign(bullets.at(-1),{damage:6,source:'봉인의 잔해 '+REMNANT_NAMES[e.part],demonShot:true});}
export function startRemnantAttack(e,p,turn){
 const kind=e.part==='core'?['cleave','stomp','rush','nova'][turn%4]:{hand:'fan',foot:turn%2?'rush':'stomp',eye:'ray',nose:'rush',mouth:'fan'}[e.part];
 return {owner:e.part,kind,time:kind==='rush'?1:kind==='ray'?1.1:.85,duration:kind==='rush'?1:kind==='ray'?1.1:.85,x:e.x,y:e.y,tx:clamp(p.x,100,860),ty:clamp(p.y,100,440),aim:aim(e,p)};
}
function resolve(e,a,r,p,bullets,hurt){
 const clear=from=>!segmentBlocked(from,p,r.obstacles,2);
 if(a.kind==='cleave'&&meleeIntersects(e,p,a.aim,160,1.05)&&clear(e))hurt(12,'봉인 완전체 휘두르기');
 if(a.kind==='stomp'&&distance({x:a.tx,y:a.ty},p)<90&&clear({x:a.tx,y:a.ty}))hurt(12,'봉인 잔해 내려찍기');
 if(a.kind==='rush'){
  const from={x:e.x,y:e.y},dx=a.tx-from.x,dy=a.ty-from.y,len=Math.hypot(dx,dy),steps=Math.max(1,Math.ceil(len/8));let hit=false;
  for(let i=1;i<=steps;i++){const next={x:from.x+dx*i/steps,y:from.y+dy*i/steps};if(segmentBlocked(e,next,r.obstacles,32))break;e.x=next.x;e.y=next.y;if(distance(e,p)<44&&clear(e))hit=true;}
  safeSpawn(e,r.obstacles,32);if(hit)hurt(9,'봉인 잔해 직선 돌진');
 }
 if(a.kind==='ray'){const dx=p.x-a.x,dy=p.y-a.y,along=Math.cos(a.aim)*dx+Math.sin(a.aim)*dy,side=Math.abs(Math.sin(a.aim)*dx-Math.cos(a.aim)*dy);if(along>0&&side<22&&clear(a))hurt(9,'봉인 잔해 눈 광선');}
 if(a.kind==='fan')for(const offset of e.part==='mouth'?[-.48,-.24,0,.24,.48]:[-.36,-.18,0,.18,.36])shoot(e,a.aim+offset,bullets);
 if(a.kind==='nova')for(let i=1;i<16;i++)shoot(e,a.aim+i*Math.PI/8,bullets,210);
}
export function updateRemnantHunt(s,r,p,dt,bullets,hurt){
 const d=r.remnantBattle;if(!d||d.stage==='done')return;
 d.flashes=d.flashes.map(a=>({...a,time:Math.max(0,a.time-dt)})).filter(a=>a.time>0);
 const living=r.enemies.filter(e=>e.remnantHuntVersion===1&&e.hp>0);d.attacks=d.attacks.filter(a=>living.some(e=>e.part===a.owner));
 for(const e of living){
  const active=d.attacks.some(a=>a.owner===e.part);if(e.frozen>0)continue;
  d.partClocks[e.part]=Math.max(0,(d.partClocks[e.part]??1)-dt*frostAttackRate(e));
  if(!active&&['core','hand','foot','nose'].includes(e.part)&&distance(e,p)>(e.part==='core'?140:180)){
   const angle=steering(e,p,r.obstacles,32),speed=(e.part==='core'?65:55)*movementSlowFactor(e);moveBody(e,Math.cos(angle)*speed*dt,Math.sin(angle)*speed*dt,r.obstacles,32);
  }
 }
 for(const a of [...d.attacks]){
  const e=living.find(e=>e.part===a.owner);if(!e||e.frozen>0)continue;
  a.time=Math.max(0,a.time-dt*frostAttackRate(e));if(a.time>0)continue;
  resolve(e,a,r,p,bullets,hurt);d.flashes.push({...a,time:.22});d.attacks=d.attacks.filter(other=>other!==a);d.partClocks[e.part]=e.part==='core'?1.1:1.8;
 }
 // All five split parts are present, but only two readable attacks overlap.
 for(const e of living){if(e.frozen>0||d.attacks.length>=2||d.attacks.some(a=>a.owner===e.part)||d.partClocks[e.part]>0)continue;d.attacks.push(startRemnantAttack(e,p,d.turn++));}
 d.flashes=d.flashes.slice(-5);
}
