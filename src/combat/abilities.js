import {consumeRoyalJudgment} from '../progression/critical-skills.js';
import {bindCriticalRun,applyBoundDamage,createCriticalProfile} from './critical.js';
import {recordBossResource,observeBossEncounter} from '../progression/growth-records.js';
import {wardenArriving} from './warden-arrival.js';
import {castRoll,basicShotPower} from './roll.js';
import {hasFairy} from '../progression/skill-overhaul.js';
import {recoverPlayerPosition} from '../world/player-position.js';
import {weaponSnapshot,retireTurret} from './weapon-projectiles.js';
import {CROSSBOW,ARROW_RAIN_DAMAGE} from './combat-tuning.js';
import {bindDefenses,enemyDamageFactor} from './enemy-defense.js';
import {moveBody} from '../world/terrain.js';
import {ultimateCooldown,relicStat,dodgeCooldown,blinkDistance} from '../progression/relics.js';
export const DODGE_COOLDOWN=4;
export const ULTIMATE_COOLDOWN=25;
export function ultimateUnlocked(p){return p.ultimate===1&&['burst','turret'].includes(p.evolutions?.ultimate);}
export function castUltimate(s){if(wardenArriving(s))return false;if(s.status!=='playing'||s.player.actionStun>0||!ultimateUnlocked(s.player)||s.skill>0)return false;const empowered=consumeRoyalJudgment(s),caster=empowered?{...s.player,damage:s.player.damage*1.25,judgmentEmpowered:true}:s.player;s.skill=ultimateCooldown(s.player);const r=s.floors[s.floor][s.room];bindCriticalRun(s,r.enemies);if(s.player.evolutions.ultimate==='turret'){r.turrets??=[];if(r.turrets.length>=2)retireTurret(r,r.turrets.shift());r.turrets.push({x:s.player.x,y:s.player.y,time:CROSSBOW.lifetime,clock:0,aim:0,build:weaponSnapshot(caster),seekerClock:1.5});}else{r.arrowRain={x:s.player.x,y:s.player.y,r:280,elapsed:0,pulses:0,criticalProfile:createCriticalProfile(caster),damage:basicShotPower(caster)*ARROW_RAIN_DAMAGE*(1+relicStat(s.player,'ultimateDamage'))};tickRain(s,0);}return true;}
export function tickRain(s,dt){const r=s.floors[s.floor][s.room],z=r.arrowRain;if(!z)return;bindCriticalRun(s,r.enemies);bindDefenses(r.enemies);z.elapsed+=dt;while(z.pulses<6&&z.elapsed+1e-9>=z.pulses*.3){for(const e of r.enemies){if(e.hp<=0||e.phase==='air'||e.phase==='splitJump'||e.attackPhase==='leap'||Math.hypot(e.x-z.x,e.y-z.y)>z.r)continue;const before=e.hp;applyBoundDamage(e,z.damage*enemyDamageFactor(e),{player:z.criticalProfile??s.player,source:'arrowRain',defended:true});if(s.metrics){const dealt=before-Math.max(0,e.hp);s.metrics.damageDealt+=dealt;s.metrics.ultimateDamage=(s.metrics.ultimateDamage||0)+dealt;}}z.pulses++;}if(z.elapsed+1e-9>=1.8)r.arrowRain=null;}
export function usePotion(s){const p=s.player;if(s.status!=='playing'||s.player.actionStun>0||s.potionCooldown>0||!p.potions||p.hp>=p.max)return false;observeBossEncounter(s);p.potions--;p.hp=Math.min(p.max,p.hp+1+relicStat(p,'potion')+(hasFairy(p,'sunFairy')?1:0));s.potionCooldown=3;if(s.metrics)s.metrics.potionsUsed=(s.metrics.potionsUsed||0)+1;recordBossResource(s,'potionsUsed',1);return true;}

export const castBlink=castRoll;
