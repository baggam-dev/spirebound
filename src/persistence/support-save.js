import {SUPPORT,supportTypes} from '../combat/support-profile.js';
export function validateSupportSave(s,check,number){
 if(s.supportEncounterVersion!==undefined){check(s.supportEncounterVersion===1&&Array.isArray(s.supportPlannedPhases)&&s.supportPlannedPhases.length<=2&&new Set(s.supportPlannedPhases).size===s.supportPlannedPhases.length&&s.supportPlannedPhases.every(p=>['ascent','descent'].includes(p)));if(s.supportPlannedPhases.includes('descent'))check(s.key);}
 for(const [floor,rooms] of s.floors.entries())for(const r of rooms){
  const data=r.supportEncounter,actors=r.enemies.filter(e=>supportTypes.includes(e.type)),minions=r.enemies.filter(e=>e.type==='ossuaryMinion');
  if(!data){check(!actors.length&&!minions.length);continue;}
  check(s.supportEncounterVersion===1&&data.version===1&&floor>=2&&floor<=7&&r.type==='normal'&&!r.gate&&!r.hasChest&&!r.tutorial);let active=0;
  for(const key of ['ascent','descent']){const plan=data[key];if(!plan)continue;check(s.supportPlannedPhases.includes(key)&&['planned','active','defeated','cancelled'].includes(plan.state)&&supportTypes.includes(plan.type));if(['active','defeated'].includes(plan.state))check(Number.isInteger(plan.enemyId)&&number(plan.enemyId,0,1e6));else check(plan.enemyId===null);if(plan.state==='active'){active++;check(actors.some(e=>e.id===plan.enemyId&&e.type===plan.type));}}
  check(actors.length===active&&active<=1&&minions.length<=SUPPORT.roomCap);
  for(const e of actors){
   check(!e.summoned&&!e.elite&&e.xpReward===24);check(e.type==='ossuarySummoner'?Number.isInteger(e.supportSummons)&&number(e.supportSummons,0,4):Number.isInteger(e.supportHeals)&&number(e.supportHeals,0,3));
   if(e.supportSummons!==undefined)check(e.type==='ossuarySummoner'&&Number.isInteger(e.supportSummons)&&number(e.supportSummons,0,SUPPORT.totalSummons));
   if(e.supportHeals!==undefined)check(e.type==='choirCantor'&&Number.isInteger(e.supportHeals)&&number(e.supportHeals,0,SUPPORT.totalHeals));
   if(e.supportClock!==undefined)check(number(e.supportClock,0,6));
   if(e.attackPhase!=null){const max={supportCast:e.type==='ossuarySummoner'?SUPPORT.cast:SUPPORT.healCast,supportBolt:SUPPORT.boltWarning,supportRelease:.2,supportRecover:.65}[e.attackPhase];check(max!==undefined&&number(e.attackTime,0,max));}
   if(['supportCast','supportBolt'].includes(e.attackPhase))check(number(e.supportCastHp,0,e.max));
   if(e.attackPhase==='supportBolt')check(number(e.aim,-Math.PI,Math.PI));
   if(e.supportTarget!==undefined)check(e.type==='choirCantor'&&Number.isInteger(e.supportTarget)&&number(e.supportTarget,0,1e6));
   if(e.supportSpawn!==undefined)check(e.type==='ossuarySummoner'&&e.supportSpawn&&number(e.supportSpawn.x,70,890)&&number(e.supportSpawn.y,85,455));
   if(e.attackPhase==='supportCast')check(e.type==='ossuarySummoner'?e.supportSpawn!==undefined:e.supportTarget!==undefined);
   if(e.supportFlash!==undefined){const f=e.supportFlash;check(f&&['heal','summon','interrupt'].includes(f.kind)&&number(f.time,0,.4)&&number(f.x,-50,1010)&&number(f.y,-50,590));if(f.kind==='heal')check(number(f.amount,0,SUPPORT.healCap));}
  }
  for(const e of minions){
   check(e.summoned===true&&!e.elite&&Number.isInteger(e.summonOwner)&&number(e.summonOwner,0,1e6)&&number(e.supportLife,0,SUPPORT.minionLife));
   check(['ascent','descent'].some(key=>data[key]?.type==='ossuarySummoner'&&['active','defeated'].includes(data[key].state)&&data[key].enemyId===e.summonOwner));check(minions.filter(n=>n.summonOwner===e.summonOwner).length<=SUPPORT.ownerCap);
   if(e.attackPhase!=null){const max={minionWarning:.35,minionStrike:.18,minionRecover:.7}[e.attackPhase];check(max!==undefined&&number(e.attackTime,0,max)&&number(e.aim,-Math.PI,Math.PI));}
   if(e.minionHit!==undefined)check(typeof e.minionHit==='boolean');if(e.selfDestruct!==undefined)check(e.selfDestruct===true);
  }
 }
}
