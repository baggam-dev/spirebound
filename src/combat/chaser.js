import {attackProfile} from './balance.js';
import {segmentBlocked} from '../world/terrain.js';
export const CHASER_REACH=45;
export const CHASER_WINDUP=.08;
// Short blade reach replaces contact damage; resolve against the current target.
export function updateChaserAttack(e,p,obstacles,dt){
 e.chaserStrike=Math.max(0,(e.chaserStrike||0)-dt);
 e.chaserCooldown=Math.max(0,(e.chaserCooldown||0)-dt);
 const reachable=()=>Math.hypot(e.x-p.x,e.y-p.y)<=CHASER_REACH&&!segmentBlocked(e,p,obstacles,0);
 if(e.chaserWindup>0){
  e.chaserWindup=Math.max(0,e.chaserWindup-dt);
  if(e.chaserWindup>0)return 0;
  e.chaserStrike=.12;e.chaserCooldown=Math.max(.3,.65*attackProfile(e).recovery);
  return reachable()?9:0;
 }
 if(e.chaserCooldown===0&&reachable()){e.chaserWindup=CHASER_WINDUP;e.chaserAim=Math.atan2(p.y-e.y,p.x-e.x);}
 return 0;
}
