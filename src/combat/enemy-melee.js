import {chargerRecovering} from './balance.js';
import {segmentBlocked} from '../world/terrain.js';
export const meleeProfiles=Object.freeze({
 charger:{kind:'axe',warning:.2,radius:58,halfAngle:Math.PI/3,damage:9,recover:.65},
 brute:{kind:'fist',warning:.3,radius:66,halfAngle:1.05,damage:16,recover:.75},
 demonSoldier:{kind:'slash',warning:.2,radius:58,halfAngle:1.05,damage:9,recover:.65},
 demonCaptain:{kind:'cleave',warning:.3,radius:70,halfAngle:1.15,damage:12,recover:.8},
 ambusher:{kind:'thrust',warning:.18,radius:63,halfAngle:.48,damage:9,recover:.7}
});
export const weaponContactReplaced=e=>!!meleeProfiles[e.type]||['chaser','starKnight','royalGuard','riftHunter'].includes(e.type)||e.type==='boss'&&(!e.variant||e.variant==='king');
export function meleeIntersects(e,p,aim,radius,halfAngle,playerRadius=14){
 const x=p.x-e.x,y=p.y-e.y,d=Math.hypot(x,y),delta=Math.atan2(Math.sin(Math.atan2(y,x)-aim),Math.cos(Math.atan2(y,x)-aim));
 const ray=angle=>{const dx=Math.cos(angle),dy=Math.sin(angle),t=Math.max(0,Math.min(radius,x*dx+y*dy));return Math.hypot(x-dx*t,y-dy*t);};
 return (Math.abs(delta)<=halfAngle?Math.max(0,d-radius):Math.min(ray(aim-halfAngle),ray(aim+halfAngle)))<=playerRadius;
}
export function updateEnemyMelee(e,p,obstacles,dt){
 const profile=meleeProfiles[e.type];if(!profile)return {handled:false,damage:0};
 e.meleeCooldown=Math.max(0,(e.meleeCooldown||0)-dt);
 const radius=profile.radius*(e.scale??1),attack=e.meleeAttack;
 if(attack){
  attack.time=Math.max(0,attack.time-dt);
  if(attack.time>1e-9)return {handled:true,damage:0};
  if(attack.stage==='windup'){
   attack.stage='strike';attack.time=.12;
   return {handled:true,damage:meleeIntersects(e,p,attack.aim,radius,profile.halfAngle)&&!segmentBlocked(e,p,obstacles,0)?profile.damage:0};
  }
  if(attack.stage==='strike'){attack.stage='recover';attack.time=profile.recover;return {handled:true,damage:0};}
  delete e.meleeAttack;e.meleeCooldown=.25;return {handled:true,damage:0};
 }
 const busy=chargerRecovering(e)||e.eliteWarning>0||e.phase||e.attackPhase||e.darkAttack||e.gravity||Number.isFinite(e.chargeAngle);
 const near=Math.hypot(e.x-p.x,e.y-p.y)<=radius+14&&!segmentBlocked(e,p,obstacles,0);
 if(busy||!near)return {handled:false,damage:0};
 if(e.meleeCooldown>0)return {handled:true,damage:0};
 e.meleeAttack={stage:'windup',time:profile.warning,aim:Math.atan2(p.y-e.y,p.x-e.x)};
 // Do not immediately chain a charge onto a completed close-range swing.
 if(e.type==='charger')e.cd=Math.max(1.8,e.cd||0);
 return {handled:true,damage:0};
}
