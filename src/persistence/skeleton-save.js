import {isSkeleton,skeletonWave} from '../combat/skeleton-profile.js';
export function validateSkeletonSave(s,check,number){
 for(const r of s.floors.flat())for(const e of r.enemies){
  if(e.kingSkeletonVersion!==undefined)check(e.type==='boss'&&e.variant==='king'&&e.shadowBoss!==1&&e.kingSkeletonVersion===1);
  if(e.skeletonSummonPhase!==undefined)check(e.variant==='king'&&e.shadowBoss!==1&&[1,2,3].includes(e.skeletonSummonPhase));
  if(e.skeletonClock!==undefined)check(e.variant==='king'&&e.shadowBoss!==1&&number(e.skeletonClock,0,5));
  if(e.skeletonPortals!==undefined){check(e.variant==='king'&&e.shadowBoss!==1&&Array.isArray(e.skeletonPortals)&&[1,2,3].includes(e.skeletonSummonPhase)&&e.skeletonPortals.length===skeletonWave(e.skeletonSummonPhase).count&&number(e.skeletonPortalTime,0,.8));for(const p of e.skeletonPortals)check(number(p.x,0,960)&&number(p.y,0,540));}
  if(!isSkeleton(e))continue;
  check(e.skeletonVersion===1&&e.summoned===true&&Number.isInteger(e.summoner)&&r.enemies.some(k=>k.id===e.summoner&&k.variant==='king'&&k.shadowBoss!==1));
  if(e.skeletonCleanup!==undefined)check(e.skeletonCleanup===true&&e.hp<=0);
  if(e.skeletonDashClock!==undefined)check(number(e.skeletonDashClock,0,4));
  if(e.skeletonMoving!==undefined)check(typeof e.skeletonMoving==='boolean');
  if(e.skeletonWalk!==undefined)check(number(e.skeletonWalk,0,1e9));
  if(e.skeletonLastPattern!==undefined)check(['fan','ricochet','burst'].includes(e.skeletonLastPattern)&&[1,2].includes(e.skeletonPatternRepeats));
  if(e.skeletonAttack){const a=e.skeletonAttack;check(['slash','dash','fan','ricochet','burst'].includes(a.kind)&&['windup','active','recover'].includes(a.stage)&&number(a.time,0,.8)&&number(a.aim,-Math.PI,Math.PI));if(a.elapsed!==undefined)check(number(a.elapsed,0,1));if(a.shots!==undefined)check(Number.isInteger(a.shots)&&number(a.shots,0,3));if(a.hit!==undefined)check(typeof a.hit==='boolean');}
 }
 for(const b of s.projectiles||[])if(b.skeletonShot!==undefined)check(b.skeletonShot===true&&b.enemy===true&&Number.isInteger(b.skeletonOwner)&&s.floors[s.floor][s.room].enemies.some(e=>e.id===b.skeletonOwner&&e.variant==='king'&&e.shadowBoss!==1));
}
