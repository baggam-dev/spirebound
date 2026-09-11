import {skillPoints} from './skill-tree.js';
export const DODGE_COOLDOWN=20;
export const ULTIMATE_COOLDOWN=25;
export function ultimateUnlocked(p){return skillPoints(p)>=5;}
export function castUltimate(s){if(s.status!=='playing'||!ultimateUnlocked(s.player)||s.skill>0)return false;s.skill=s.player.relic==='rain'?20:ULTIMATE_COOLDOWN;const r=s.floors[s.floor][s.room];if(s.player.evolutions?.ultimate==='field')r.allyZone={x:s.player.x,y:s.player.y,r:145,time:5};else for(const e of r.enemies){const before=Math.max(0,e.hp);e.hp-=120*(e.protected?.5:1);if(s.metrics)s.metrics.damageDealt+=before-Math.max(0,e.hp);}return true;}
