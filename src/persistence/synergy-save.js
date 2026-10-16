import {synergyIds} from '../progression/synergies.js';

export function validateSynergyPlayer(p,check,number){
 for(const id of synergyIds)if(p[id]!==undefined)check(Number.isInteger(p[id])&&number(p[id],0,3));
 if(p.chargeHits!==undefined)check(Number.isInteger(p.chargeHits)&&number(p.chargeHits,0,3));
 if(p.chargeReady!==undefined)check(typeof p.chargeReady==='boolean');
}
export function validateSynergyEnemy(e,check,number){
 for(const [id,max] of [['emberCooldown',2],['venomCooldown',1.5],['sporeCooldown',2]])if(e[id]!==undefined)check(number(e[id],0,max));
 if(e.sporeLevel!==undefined)check(Number.isInteger(e.sporeLevel)&&number(e.sporeLevel,1,3));
 if(e.thawBond!==undefined)check(typeof e.thawBond==='boolean');
 if(e.sporeDot!==undefined)check(e.sporeDot&&number(e.sporeDot.time,0,1.5)&&number(e.sporeDot.dps,0,1000));
}
