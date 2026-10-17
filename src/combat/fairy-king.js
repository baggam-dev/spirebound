import {basicShotPower} from './roll.js';
import {enemyDamageFactor} from './enemy-defense.js';
import {segmentBlocked} from '../world/terrain.js';
export function tickFairyKing(s,r,dt){
 if(!s.player.fairyKing)return;const p=s.player;
 s.fairyKingClock=Math.max(0,(s.fairyKingClock??.6)-dt);
 if(!r.fairyBeam&&s.fairyKingClock<=0){const target=r.enemies.filter(e=>e.hp>0&&!['air','splitJump'].includes(e.phase)&&e.attackPhase!=='leap'&&Math.hypot(e.x-p.x,e.y-p.y)<400&&!segmentBlocked(p,e,r.obstacles,2)).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];if(target){r.fairyBeam={x:p.x,y:p.y-20,aim:Math.atan2(target.y-(p.y-20),target.x-p.x),time:.6,power:basicShotPower(p)*6};s.fairyKingClock=3;}}
 const b=r.fairyBeam;if(!b)return;const active=Math.min(dt,b.time);b.time=Math.max(0,b.time-dt);
 for(const e of r.enemies){if(e.hp<=0||['air','splitJump'].includes(e.phase)||e.attackPhase==='leap')continue;const dx=e.x-b.x,dy=e.y-b.y,along=dx*Math.cos(b.aim)+dy*Math.sin(b.aim),across=Math.abs(-dx*Math.sin(b.aim)+dy*Math.cos(b.aim));if(along<0||along>420||across>20||segmentBlocked(b,e,r.obstacles,2))continue;const hp=e.hp;e.hp-=b.power*active/.6*enemyDamageFactor(e,b);if(s.metrics)s.metrics.damageDealt+=hp-Math.max(0,e.hp);}
 if(b.time<=0)r.fairyBeam=null;
}
