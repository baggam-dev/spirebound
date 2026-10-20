import {wardenArriving} from './warden-arrival.js';
import {recoverPlayerPosition} from '../world/player-position.js';
import {moveBody,segmentBlocked} from '../world/terrain.js';
import {dodgeCooldown,blinkDistance,relicStat,hexFactor} from '../progression/relics.js';
import {enemyDamageFactor} from './enemy-defense.js';
import {evolutions} from '../progression/evolutions.js';
export function rollAction(p){const branch=evolutions.rollMastery.find(e=>e.id===p.evolutions?.rollMastery);return {name:branch?.name||'구르기',icon:branch?'rollMastery:'+branch.id:'roll',description:branch?.description||'짧은 무적 회피'};}
export const basicShotPower=p=>p.damage*(1+.12*(p.power||0)+relicStat(p,'damage'))*hexFactor(p,'damage')*(p.fairyKing?1.15:1);
const airborne=e=>['air','splitJump'].includes(e.phase)||e.attackPhase==='leap';
function deal(s,e,damage,origin){const hp=Math.max(0,e.hp);e.hp-=damage*enemyDamageFactor(e,origin);if(s.metrics)s.metrics.damageDealt+=hp-Math.max(0,e.hp);}
export function rollProfile(p){const kind=p.evolutions?.rollMastery;return {kind,distance:blinkDistance(p)*(kind==='mines'?1.2:1),duration:kind==='swift'?.224:.28,invulnerability:Math.min(.35,.25+Math.min(.05,relicStat(p,'blinkInvulnerability'))),cooldown:Math.max(2.5,dodgeCooldown(p)-(kind==='swift'?.5:0))};}
export function castRoll(s,direction={x:0,y:0}){
 if(wardenArriving(s))return false;
 const p=s.player;if(s.status!=='playing'||p.actionStun>0||s.dodge>0||s.roll)return false;
 const r=s.floors[s.floor][s.room];recoverPlayerPosition(p,r.obstacles);const d=Math.hypot(direction.x,direction.y)>0?direction:p.lastMove||{x:1,y:0},len=Math.hypot(d.x,d.y)||1,dx=d.x/len,dy=d.y/len;
 const probe={x:p.x,y:p.y};moveBody(probe,dx*8,dy*8,r.obstacles,14,{minX:50,maxX:910,minY:65,maxY:475});if(Math.hypot(probe.x-p.x,probe.y-p.y)<1)return false;
 const q=rollProfile(p);s.dodge=q.cooldown;s.roll={x:dx,y:dy,elapsed:0,duration:q.duration,distance:q.distance,kind:q.kind||null,origin:{x:p.x,y:p.y},hit:[],mines:0,damage:basicShotPower(p),immune:Math.min(q.duration,q.invulnerability)};return true;
}
export function tickRoll(s,r,dt,effects){
 const q=s.roll;if(!q)return false;const p=s.player,active=Math.min(dt,q.duration-q.elapsed),before={x:p.x,y:p.y};
 const step=q.distance/q.duration*active;moveBody(p,q.x*step,q.y*step,r.obstacles,14,{minX:50,maxX:910,minY:65,maxY:475});q.elapsed+=active;
 if(q.kind==='slash')for(const e of r.enemies)if(e.hp>0&&!airborne(e)&&!q.hit.includes(e.id)){
  const vx=p.x-before.x,vy=p.y-before.y,t=Math.max(0,Math.min(1,((e.x-before.x)*vx+(e.y-before.y)*vy)/(vx*vx+vy*vy||1))),near={x:before.x+t*vx,y:before.y+t*vy};
  if(Math.hypot(e.x-near.x,e.y-near.y)<=32&&!segmentBlocked(near,e,r.obstacles,2)){deal(s,e,q.damage*3,near);q.hit.push(e.id);}
 }
 if(q.kind==='mines')while(q.mines<3&&q.elapsed+1e-9>=q.mines*q.duration/3){const point=q.mines===0?{...q.origin}:{x:p.x,y:p.y};(r.rollMines??=[]).push({...point,time:3,damage:q.damage*1.5});q.mines++;}
 effects.push({blinkTrail:true,fromX:before.x,fromY:before.y,x:p.x,y:p.y,t:.18,duration:.18});
 if(q.elapsed+1e-9>=q.duration||Math.hypot(p.x-before.x,p.y-before.y)<step*.2)delete s.roll;
 return true;
}
export const rollImmune=s=>!!s.roll&&s.roll.elapsed<=s.roll.immune;
export function tickRollMines(s,r,dt,effects){for(const m of r.rollMines||[]){m.time-=dt;if(m.time<=0){for(const e of r.enemies)if(e.hp>0&&!airborne(e)&&Math.hypot(e.x-m.x,e.y-m.y)<=70&&!segmentBlocked(m,e,r.obstacles,2))deal(s,e,m.damage,m);effects.push({x:m.x,y:m.y,r:70,t:.3,duration:.3,color:'#b5a1ee',groundBurst:true});}}r.rollMines=(r.rollMines||[]).filter(m=>m.time>0);}
