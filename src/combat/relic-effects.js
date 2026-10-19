import {hasRelic} from '../progression/relics.js';
import {basicShotPower} from './roll.js';
import {bindDefenses,enemyDamageFactor} from './enemy-defense.js';
import {segmentBlocked} from '../world/terrain.js';

// Call only after recording actual external HP loss; shields and self-costs bypass it.
export function reactToRelicHit(s,r,effects=[]){
 const p=s.player;
 if(hasRelic(p,'thornBuckle')&&!(s.thornCooldown>0)){
  s.thornCooldown=2;bindDefenses(r.enemies);const power=basicShotPower(p);
  for(const e of r.enemies){if(e.hp<=0||['air','splitJump'].includes(e.phase)||e.attackPhase==='leap'||Math.hypot(e.x-p.x,e.y-p.y)>80||segmentBlocked(p,e,r.obstacles,2))continue;
   const before=Math.max(0,e.hp);e.hp-=power*enemyDamageFactor(e,p);if(s.metrics)s.metrics.damageDealt+=before-Math.max(0,e.hp);
  }
  effects.push({x:p.x,y:p.y-24,t:.3,text:'반격',color:'#d1c2a5'});
 }
 if(p.hp<=0&&hasRelic(p,'phoenixReliquary')&&!s.phoenixSpent){
  s.phoenixSpent=true;p.hp=Math.min(p.max,2);s.invulnerable=1.5;
  effects.push({x:p.x,y:p.y-42,t:.8,text:'불사조의 성유골 · 부활',color:'#aedcf2'});return true;
 }
 return false;
}
