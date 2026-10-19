import {basicShotPower} from './roll.js';
import {relicStat} from '../progression/relics.js';
import {enemyDamageFactor} from './enemy-defense.js';
import {segmentBlocked} from '../world/terrain.js';
import {fairyPosition} from './fairy-position.js';
export function tickFairyKing(s,r,dt){
 if(!s.player.fairyKing)return;const p=s.player;
 s.fairyKingClock=Math.max(0,(s.fairyKingClock??.6)-dt);
 if(!r.fairyBeam&&s.fairyKingClock<=0){const from=fairyPosition(s,3,r.obstacles),target=r.enemies.filter(e=>e.hp>0&&!['air','splitJump'].includes(e.phase)&&e.attackPhase!=='leap'&&Math.hypot(e.x-from.x,e.y-from.y)<400&&!segmentBlocked(from,e,r.obstacles,2)).sort((a,b)=>Math.hypot(a.x-from.x,a.y-from.y)-Math.hypot(b.x-from.x,b.y-from.y))[0];if(target){r.fairyBeam={...from,aim:Math.atan2(target.y-from.y,target.x-from.x),time:.6,power:basicShotPower(p)*6*(1+relicStat(p,'fairyDamage'))};s.fairyKingClock=3;}}
 const b=r.fairyBeam;if(!b)return;const active=Math.min(dt,b.time);b.time=Math.max(0,b.time-dt);
 for(const e of r.enemies){if(e.hp<=0||['air','splitJump'].includes(e.phase)||e.attackPhase==='leap')continue;const dx=e.x-b.x,dy=e.y-b.y,along=dx*Math.cos(b.aim)+dy*Math.sin(b.aim),across=Math.abs(-dx*Math.sin(b.aim)+dy*Math.cos(b.aim));if(along<0||along>420||across>20||segmentBlocked(b,e,r.obstacles,2))continue;const hp=e.hp;e.hp-=b.power*active/.6*enemyDamageFactor(e,b);if(s.metrics)s.metrics.damageDealt+=hp-Math.max(0,e.hp);}
 if(b.time<=0)r.fairyBeam=null;
}
