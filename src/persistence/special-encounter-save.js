import {relicInfo} from '../progression/relics.js';
import {ROAMING_XP} from '../world/special-encounters.js';
export function validateSpecialEncounters(s,check,number){
 if(s.specialEncounterVersion!==undefined)check(s.specialEncounterVersion===1);
 for(const [floor,rooms] of s.floors.entries()){
  check(rooms.filter(r=>r.specialEncounter).length<=1);
  for(const r of rooms){
   const plan=r.specialEncounter,actors=r.enemies.filter(e=>e.roamingElite!==undefined);
   if(!plan){check(actors.length===0);continue;}
   check(s.specialEncounterVersion===1&&floor>=1&&floor<=7&&r.type==='normal'&&!r.hasChest&&!r.tutorial&&!r.gate);
   check(plan&&typeof plan==='object'&&!Array.isArray(plan)&&plan.version===1&&plan.kind==='roamingElite'&&['planned','active','defeated','cancelled'].includes(plan.state));
   check(plan.relicId===null||!!relicInfo(plan.relicId)&&!['crackedCrown','sunFairy','snowFairy','stormFairy'].includes(plan.relicId));
   check(['attack','speed','health','haste','ultimate'].includes(plan.fallbackEssence)&&typeof plan.rewarded==='boolean');
   if(plan.state==='active'||plan.state==='defeated')check(Number.isInteger(plan.enemyId)&&number(plan.enemyId,0,1000000));else check(plan.enemyId===null);
   check(plan.rewarded===(plan.state==='defeated'));
   if(plan.state==='active')check(actors.length===1&&actors[0].id===plan.enemyId);else check(actors.length===0);
   for(const e of actors)check(e.roamingElite===true&&e.type==='chaser'&&e.elite==='guardian'&&!e.summoned&&e.xpReward===ROAMING_XP);
  }
 }
}
