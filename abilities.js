export const DODGE_COOLDOWN=20;
export const ULTIMATE_COOLDOWN=25;
export function ultimateUnlocked(p){return ['split','pierce','haste','fire','frost','chain'].reduce((n,k)=>n+(p[k]||0),0)>=5;}
export function castUltimate(s){if(s.status!=='playing'||!ultimateUnlocked(s.player)||s.skill>0)return false;s.skill=ULTIMATE_COOLDOWN;for(const e of s.floors[s.floor][s.room].enemies)e.hp-=120;return true;}
