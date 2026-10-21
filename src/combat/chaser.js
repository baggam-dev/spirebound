import {attackProfile} from './balance.js';
import {segmentBlocked} from '../world/terrain.js';
import {CHASER_SLASH,chaserSlashIntersects} from './chaser-slash-area.js';
export const CHASER_REACH=CHASER_SLASH.radius;
export const CHASER_WINDUP=.1;
// Short blade reach replaces contact damage; resolve against the current target.
export function updateChaserAttack(e,p,obstacles,dt){
 e.chaserStrike=Math.max(0,(e.chaserStrike||0)-dt);
 e.chaserCooldown=Math.max(0,(e.chaserCooldown||0)-dt);
 const targetAim=Math.atan2(p.y-e.y,p.x-e.x);
 const reachable=aim=>chaserSlashIntersects(e,p,aim)&&!segmentBlocked(e,p,obstacles,0);
 if(e.chaserWindup>0){
  e.chaserWindup=Math.max(0,e.chaserWindup-dt);
  if(e.chaserWindup>0)return 0;
  e.chaserStrike=CHASER_SLASH.duration;e.chaserCooldown=Math.max(.3,.65*attackProfile(e).recovery);
  return reachable(Number.isFinite(e.chaserAim)?e.chaserAim:targetAim)?9:0;
 }
 if(e.chaserCooldown===0&&reachable(targetAim)){e.chaserWindup=CHASER_WINDUP;e.chaserAim=targetAim;}
 return 0;
}
