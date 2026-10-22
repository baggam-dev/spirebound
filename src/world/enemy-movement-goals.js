// Disposable movement hints only; never used as an attack target or saved actor state.
import {chargerRecovering} from '../combat/balance.js';
let goals=new WeakMap();
export function replaceEnemyMovementGoals(next){goals=next;}
export function enemyMovementLocked(e){return e.hp<=0||e.frozen>0||e.spawnGrace>0||e.opening>0||e.eliteWarning>0||e.meleeAttack||e.meleeCooldown>0||chargerRecovering(e)||e.darkAttack||e.gravity||e.attackPhase||e.phase||Number.isFinite(e.chargeAngle)||e.chaserWindup>0||e.chaserStrike>0;}
export function enemyMovementGoal(e,player){const g=goals.get(e);return g&&!enemyMovementLocked(e)&&(!player||g.player===player)?g:null;}
export function enemyNavigationTarget(e,target){return enemyMovementGoal(e,target)?.target||target;}
export function enemySeparationStep(e,dx,dy){
 const g=enemyMovementGoal(e),length=Math.hypot(dx,dy);if(!g||!length||!g.push)return {dx,dy};
 if(g.positioned&&Math.hypot(g.target.x-e.x,g.target.y-e.y)<4)return {dx:0,dy:0};
 const x=dx/length+g.push.x*.45,y=dy/length+g.push.y*.45,n=Math.hypot(x,y)||1;
 return {dx:x/n*length,dy:y/n*length};
}
