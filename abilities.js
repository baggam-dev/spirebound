import {CROSSBOW} from './combat-tuning.js';
import {bindDefenses,enemyDamageFactor} from './enemy-defense.js';
import {moveBody} from './terrain.js';
import {ultimateCooldown,relicStat,dodgeCooldown,blinkDistance} from './relics.js';
export const DODGE_COOLDOWN=10;
export const ULTIMATE_COOLDOWN=25;
export function ultimateUnlocked(p){return p.ultimate===1&&['burst','turret'].includes(p.evolutions?.ultimate);}
export function castUltimate(s){if(s.status!=='playing'||!ultimateUnlocked(s.player)||s.skill>0)return false;s.skill=ultimateCooldown(s.player);const r=s.floors[s.floor][s.room];if(s.player.evolutions.ultimate==='turret'){r.turrets??=[];if(r.turrets.length>=2)r.turrets.shift();r.turrets.push({x:s.player.x,y:s.player.y,time:CROSSBOW.lifetime,clock:0,aim:0});}else{r.arrowRain={x:s.player.x,y:s.player.y,r:280,elapsed:0,pulses:0,damage:60*(1+relicStat(s.player,'ultimateDamage'))};tickRain(s,0);}return true;}
export function tickRain(s,dt){const r=s.floors[s.floor][s.room],z=r.arrowRain;if(!z)return;bindDefenses(r.enemies);z.elapsed+=dt;while(z.pulses<3&&z.elapsed+1e-9>=z.pulses*.6){for(const e of r.enemies){if(e.hp<=0||e.phase==='air'||e.phase==='splitJump'||e.attackPhase==='leap'||Math.hypot(e.x-z.x,e.y-z.y)>z.r)continue;const before=e.hp;e.hp-=z.damage*enemyDamageFactor(e);if(s.metrics){const dealt=before-Math.max(0,e.hp);s.metrics.damageDealt+=dealt;s.metrics.ultimateDamage=(s.metrics.ultimateDamage||0)+dealt;}}z.pulses++;}if(z.elapsed+1e-9>=1.8)r.arrowRain=null;}
export function usePotion(s){const p=s.player;if(s.status!=='playing'||s.potionCooldown>0||!p.potions||p.hp>=p.max)return false;p.potions--;p.hp=Math.min(p.max,p.hp+1+relicStat(p,'potion'));s.potionCooldown=3;if(s.metrics)s.metrics.potionsUsed++;return true;}

export function castBlink(s,direction){if(s.status!=='playing'||s.dodge>0)return false;const length=Math.hypot(direction.x,direction.y)||1;s.dodge=dodgeCooldown(s.player);s.invulnerable=Math.max(s.invulnerable||0,.45+relicStat(s.player,'blinkInvulnerability'));moveBody(s.player,direction.x/length*blinkDistance(s.player),direction.y/length*blinkDistance(s.player),s.floors[s.floor][s.room].obstacles);s.player.x=Math.max(50,Math.min(910,s.player.x));s.player.y=Math.max(65,Math.min(475,s.player.y));return true;}
