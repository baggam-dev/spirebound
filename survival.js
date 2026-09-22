import {relicStat,hasRelic} from './relics.js';
import {damageHearts,heal} from './health.js';
import {essences} from './essences.js';
export function monsterPotionReward(s,room,position=s.player,random=Math.random){
 if(s.player.potions>=5){if(random()<.2){(room.essences??=[]).push({id:essences[Math.min(4,Math.floor(random()*5))].id,x:position.x,y:position.y});return 'essence';}return null;}
 s.player.potions++;room.battlePotions=(room.battlePotions||0)+1;return 'potion';
}
export function shieldCooldown(p){return Math.max(12,Math.max(20,35-Math.max(0,(p.armor||0)-2)*2)-relicStat(p,'shield')-(p.shrineShield||0));}
export function takeDamage(s,raw,kind=null){
 if(s.status!=='playing'||s.invulnerable>0||raw<=0)return 'ignored';
 s.invulnerable=.65;
 if(s.player.aura>=3&&!(s.auraShield>0)){s.auraShield=60-relicStat(s.player,'auraShield');return 'blocked';}
 if(s.player.armor>0&&!(s.shield>0)){s.shield=shieldCooldown(s.player);return 'blocked';}
 s.player.hp=Math.max(0,s.player.hp-(['laser','bruteJump'].includes(kind)?2:s.key?1:damageHearts(raw)));return 'hurt';
}
export function killRecovery(s,room,boss,random=Math.random,position=s.player){
 const p=s.player;
 if(hasRelic(p,'windSeal')){p.leechKills=(p.leechKills||0)+1;if(p.leechKills>=20){p.leechKills=0;heal(p,1);}}
 if(!boss&&!room.potionDropped&&random()<.03){room.potionDropped=true;return monsterPotionReward(s,room,position,random)==='potion';}return false;
}
