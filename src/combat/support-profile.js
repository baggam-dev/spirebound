export const supportTypes=['ossuarySummoner','choirCantor'];
export const supportActorTypes=[...supportTypes,'ossuaryMinion'];
export const SUPPORT=Object.freeze({radius:19,minionRadius:15,cast:1.1,healCast:.95,boltWarning:.55,healRange:220,healRate:.08,healCap:24,ownerCap:2,roomCap:4,totalSummons:4,totalHeals:3,enemyCap:64,minionLife:18});
export function interruptSupportCast(e,cooldown=2.5){e.attackPhase='supportRecover';e.attackTime=.65;e.supportClock=cooldown;e.supportFlash={kind:'interrupt',time:.35,x:e.x,y:e.y};delete e.supportTarget;delete e.supportSpawn;delete e.supportCastHp;}
export function interruptSupportIfNeeded(e){
 if(supportTypes.includes(e.type)&&['supportCast','supportBolt'].includes(e.attackPhase)&&(e.frozen>0||e.opening>0||e.hp<=e.supportCastHp-e.max*.1))interruptSupportCast(e);
}
export function resetSupportAttack(e){
 if(!supportActorTypes.includes(e.type))return;
 delete e.attackPhase;delete e.attackTime;delete e.supportTarget;delete e.supportSpawn;delete e.supportCastHp;delete e.supportFlash;delete e.minionHit;e.cd=Math.max(1,e.cd||0);
}
export function tickSupportState(e,dt){
 if(e.type==='ossuaryMinion'){e.supportLife=Math.max(0,(e.supportLife??SUPPORT.minionLife)-dt);if(!e.supportLife){e.hp=0;e.selfDestruct=true;e.frostShattered=true;}return;}
 if(!supportTypes.includes(e.type))return;
 if(e.supportFlash){e.supportFlash.time=Math.max(0,e.supportFlash.time-dt);if(!e.supportFlash.time)delete e.supportFlash;}
 interruptSupportIfNeeded(e);
}
