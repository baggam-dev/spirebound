import {segmentBlocked} from '../world/terrain.js';
import {enemyDamageFactor} from './enemy-defense.js';
import {relicStat} from '../progression/relics.js';

// Animation/attack state is transient. The cooldown is saved on the run so a
// reload cannot grant a second attack; re-entry discards an off-screen swing.
const states=new WeakMap();
const airborne=e=>e.phase==='air'||e.phase==='splitJump'||e.attackPhase==='leap';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function bladeProfile(p){
 const level=Math.min(3,Math.max(0,p.aura||0)),branch=p.evolutions?.aura;
 const heavy=branch==='judgment',swift=branch==='dance';
 return {radius:(heavy?116:96)*(1+relicStat(p,'auraRange')),halfAngle:heavy?1.05:.76,
  damage:([0,34,43,52][level])*(heavy?1.65:swift?.65:1)*(1+relicStat(p,'auraDamage')),
  cooldown:([0,1.7,1.35,1.2][level])*(heavy?1.25:swift?.85:1)*(1-Math.min(.5,relicStat(p,'auraShield')/100)),
  windup:level>=2?.1:.16,strikes:swift?2:1};
}
export function resetSpectralBlade(s){states.delete(s);}
export function spectralBladeState(s){return states.get(s)||null;}
export function bladeElement(p){return p.mainSkill||(['fire','frost','poison','chain','precision'].find(k=>p[k]>0))||'spectral';}
export function bladeColor(p){return {fire:'#e6a16c',frost:'#a6dcec',poison:'#a7cb82',chain:'#c4a2e7',precision:'#e1c38b',spectral:'#b9aad5'}[bladeElement(p)]||'#b9aad5';}

function hit(s,room,state,profile,effects){
 const p=s.player,origin={x:p.x,y:p.y};
 // Recheck each target after preparation, permitting enemies before a wall.
 let discharged=false;
 for(const e of room.enemies){
  if(e.hp<=0||airborne(e)||distance(e,p)>profile.radius)continue;
  const angle=Math.atan2(e.y-p.y,e.x-p.x)-state.aim;
  if(Math.abs(Math.atan2(Math.sin(angle),Math.cos(angle)))>profile.halfAngle||segmentBlocked(origin,e,room.obstacles,2))continue;
  const before=Math.max(0,e.hp),marked=p.mainSkill==='precision'&&e.precisionHits>0&&e.precisionTime>0;
  const damage=profile.damage*(marked?1.2:1)*enemyDamageFactor(e,origin);
  if(damage<=0)continue;e.hp-=damage;
  s.metrics.damageDealt+=before-Math.max(0,e.hp);
  effects.push({x:e.x,y:e.y,r:17,t:.14,color:bladeColor(p),slash:true});
  // Lightweight, bounded secondary effects: never call hitEnemy or advance
  // primary marks/freezes/chain counters, nor seed poison corpse chains.
  if(e.hp>0&&p.mainSkill==='frost'){e.slow=Math.max(e.slow||0,.6);e.slowFactor=Math.min(e.slowFactor??1,e.type==='boss'?.94:.8);}
  if(e.hp>0&&['fire','poison'].includes(p.mainSkill))e.bladeDot={time:1,dps:4,kind:p.mainSkill};
  if(p.mainSkill==='chain'&&!discharged){
   const other=room.enemies.filter(n=>n!==e&&n.hp>0&&!airborne(n)&&distance(n,e)<=64&&!segmentBlocked(e,n,room.obstacles,2)).sort((a,b)=>distance(a,e)-distance(b,e))[0];
   if(other){const hp=other.hp;other.hp-=profile.damage*.25*enemyDamageFactor(other,e);s.metrics.damageDealt+=hp-Math.max(0,other.hp);effects.push({x:e.x,y:e.y,toX:other.x,toY:other.y,t:.16,color:bladeColor(p)});discharged=true;}
  }
 }
}
export function tickSpectralBlade(s,room,dt,effects){
 const p=s.player;if(!p.aura){states.delete(s);return;}
 for(const e of room.enemies)if(e.bladeDot){const dot=e.bladeDot;
  if(e.hp>0&&!airborne(e)){const hp=e.hp;e.hp-=Math.min(dt,dot.time)*dot.dps*enemyDamageFactor(e);s.metrics.damageDealt+=hp-Math.max(0,e.hp);}
  dot.time=Math.max(0,dot.time-dt);if(!dot.time)delete e.bladeDot;
 }
 s.bladeCooldown=Math.max(0,(s.bladeCooldown||0)-dt);
 const profile=bladeProfile(p);let state=states.get(s);
 if(state&&state.room!==room){states.delete(s);state=null;}
 if(state){
  if(p.actionStun>0){states.delete(s);return;}
  state.time+=dt;
  for(let i=0;i<profile.strikes;i++)if(state.struck<=i&&state.time>=profile.windup+.18*i){
   // The second cut must still find its original target alive and in reach.
   const valid=i===0||room.enemies.some(e=>e===state.target&&e.hp>0&&!airborne(e)&&distance(e,p)<=profile.radius&&!segmentBlocked(p,e,room.obstacles,2));
   if(valid){if(i>0)state.aim=Math.atan2(state.target.y-p.y,state.target.x-p.x);hit(s,room,state,profile,effects);}state.struck=i+1;
  }
  if(state.time>=profile.windup+.18*(profile.strikes-1)+.28)states.delete(s);
  return;
 }
 if(s.bladeCooldown>0||p.actionStun>0||s.entryGrace>0)return;
 const targets=room.enemies.filter(e=>e.hp>0&&!airborne(e)&&distance(e,p)<=profile.radius&&!segmentBlocked(p,e,room.obstacles,2));
 targets.sort((a,b)=>{
  const marked=e=>p.mainSkill==='precision'&&e.precisionHits>0&&e.precisionTime>0?1:0;
  return marked(b)-marked(a)||distance(a,p)-distance(b,p);
 });
 const target=targets[0];if(!target)return;
 state={room,target,time:0,aim:Math.atan2(target.y-p.y,target.x-p.x),struck:0};states.set(s,state);
 s.bladeCooldown=profile.cooldown;
}
