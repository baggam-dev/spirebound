import {basicShotPower} from './roll.js';
import {applyPlayerDamage,createCriticalProfile} from './critical.js';
import {bindDefenses} from './enemy-defense.js';
import {segmentBlocked} from '../world/terrain.js';

export const expandedUtilities=[
 {id:'frostWave',name:'서리파동',description:'주변 120 범위 공격력 100% · 이동 40% 둔화 2초 / 보스 20%·1초 · 재사용 22초'},
 {id:'thunderSigil',name:'뇌격인장',description:'가까운 적 위치에 인장 · 0.65초 뒤 반경 80 공격력 240% · 재사용 28초'},
 {id:'galeVeil',name:'질풍장막',description:'3초 이동 +35% · 가까운 일반 적탄 최대 2개 소거 · 빔·장판·반사탄 제외 · 재사용 26초'}
];
const airborne=e=>['air','splitJump'].includes(e.phase)||e.attackPhase==='leap';
export function sigilTarget(s){
 const r=s.floors[s.floor][s.room],p=s.player;
 return r.enemies.filter(e=>e.hp>0&&!airborne(e)&&Math.hypot(e.x-p.x,e.y-p.y)<=500&&!segmentBlocked(p,e,r.obstacles,0)).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
}
export const canStartExpandedUtility=(s,id)=>id!=='thunderSigil'||!!sigilTarget(s);
export function startExpandedUtility(s,id){
 if(id==='galeVeil'){s.player.galeTime=3;s.player.galeCharges=2;return true;}
 if(!['frostWave','thunderSigil'].includes(id))return false;
 const p=s.player,target=id==='thunderSigil'?sigilTarget(s):p;if(!target)return false;
 s.utilityCast={version:1,id,floor:s.floor,room:s.room,x:target.x,y:target.y,origin:{x:p.x,y:p.y},remaining:id==='thunderSigil'?.65:0,damage:basicShotPower(p)*(id==='thunderSigil'?2.4:1),criticalProfile:createCriticalProfile(p)};
 return true;
}
// Apply inside simulation so lethal hits use its normal hit/death/reward pipeline.
export function tickUtilityCast(s,r,dt,effects){
 const q=s.utilityCast;if(!q)return;
 if(q.floor!==s.floor||q.room!==s.room){delete s.utilityCast;return;}
 q.remaining=Math.max(0,q.remaining-dt);if(q.remaining>0)return;
 delete s.utilityCast;bindDefenses(r.enemies);
 const frost=q.id==='frostWave',radius=frost?120:80;
 effects.push({utilityFx:q.id,x:q.x,y:q.y,r:radius,t:.32,duration:.32});
 for(const e of r.enemies){
  if(e.hp<=0||airborne(e)||Math.hypot(e.x-q.x,e.y-q.y)>radius||segmentBlocked(q,e,r.obstacles,0))continue;
  const before=Math.max(0,e.hp),hit=applyPlayerDamage(s,e,q.damage,{player:q.criticalProfile,origin:q.origin,source:q.id});
  if(s.metrics)s.metrics.damageDealt+=before-Math.max(0,e.hp);
  if(frost&&hit.applied&&e.hp>0)e.utilityFrostTime=Math.max(e.utilityFrostTime||0,e.type==='boss'?1:2);
 }
}
export function consumeGaleProjectile(s,b,point,effects){
 const p=s.player;
 if(!(p.galeTime>0)||!(p.galeCharges>0)||!b.enemy||b.ricochet||b.beam||b.laser||b.unblockable)return false;
 p.galeCharges--;b.life=0;effects.push({utilityFx:'galeBreak',x:point.x,y:point.y,r:18,t:.25,duration:.25});return true;
}
