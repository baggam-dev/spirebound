import {PURSUER} from '../combat/pursuer.js';
export function validatePursuers(s,check,number){
 if(s.pursuerVersion!==undefined)check(s.pursuerVersion===1&&s.key);
 for(const [floor,rooms] of s.floors.entries()){
  check(rooms.filter(r=>r.pursuerEncounter).length<=1);
  for(const r of rooms){
   const plan=r.pursuerEncounter,actors=r.enemies.filter(e=>e.type==='pursuer');if(!plan){check(!actors.length);continue;}
   check(s.pursuerVersion===1&&floor>=1&&floor<=7&&r.type==='normal'&&!r.gate&&!r.hasChest&&!r.tutorial);
   check(plan&&typeof plan==='object'&&!Array.isArray(plan)&&plan.version===1&&['planned','active','defeated','cancelled'].includes(plan.state)&&typeof plan.rewarded==='boolean'&&plan.rewarded===(plan.state==='defeated'));
   if(['active','defeated'].includes(plan.state))check(Number.isInteger(plan.enemyId)&&number(plan.enemyId,0,1000000));else check(plan.enemyId===null);
   if(plan.state==='active')check(actors.length===1&&actors[0].id===plan.enemyId);else check(!actors.length);
   for(const e of actors){
    check(!e.summoned&&!e.elite&&e.xpReward===PURSUER.xp&&e.escapeDepth>0&&e.balanceVersion===1);
    if(e.attackPhase!=null){check(['warning','dash','cleaveWarning','cleave','recover'].includes(e.attackPhase)&&number(e.attackTime,0,({warning:PURSUER.warning,dash:PURSUER.dash,cleaveWarning:PURSUER.cleaveWarning,cleave:PURSUER.cleave,recover:2.1})[e.attackPhase]));check(number(e.aim,-Math.PI,Math.PI));}
    if(e.facing!==undefined)check(number(e.facing,-Math.PI,Math.PI));
    for(const key of ['dashHit','cleaveHit'])if(e[key]!==undefined)check(typeof e[key]==='boolean');
   }
  }
 }
}
