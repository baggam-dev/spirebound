import {utilitySkills} from '../combat/utility.js';
import {utilityAvailable} from '../progression/skill-overhaul.js';
export function validateUtilityExpansion(s,check,number){
 const p=s.player;
 const d=s.utilityDraft;
 if(d!==undefined){
  check(!s.practice&&d&&typeof d==='object'&&!Array.isArray(d)&&d.version===1&&utilityAvailable(s));
  check(Array.isArray(d.offers)&&d.offers.length===3&&new Set(d.offers).size===3&&d.offers.every(id=>utilitySkills.some(k=>k.id===id)));
  check(d.offers.includes(d.winner)&&['prepared','revealed','claimed'].includes(d.status));
  check(d.status==='claimed'?p.utility===d.winner:p.utility===undefined);
 }
 if(p.galeTime!==undefined)check(number(p.galeTime,0,3));
 if(p.galeCharges!==undefined)check(Number.isInteger(p.galeCharges)&&number(p.galeCharges,0,2));
 if(p.galeTime>0)check(p.utility==='galeVeil'&&p.galeCharges!==undefined);
 if(p.galeCharges>0)check(p.utility==='galeVeil'&&p.galeTime>0);
 const q=s.utilityCast;
 if(q!==undefined){
  check(q&&typeof q==='object'&&!Array.isArray(q)&&q.version===1&&['frostWave','thunderSigil'].includes(q.id)&&p.utility===q.id);
  check(Number.isInteger(q.floor)&&q.floor===s.floor&&Number.isInteger(q.room)&&q.room===s.room);
  check(number(q.x,0,960)&&number(q.y,0,540)&&q.origin&&number(q.origin.x,0,960)&&number(q.origin.y,0,540));
  check(number(q.remaining,0,q.id==='thunderSigil'?.65:0)&&number(q.damage,.000001,1e8)&&s.utilityCooldown>0);
  const c=q.criticalProfile;check(c&&typeof c==='object'&&!Array.isArray(c)&&c.criticalResolved===true&&number(c.critChance,0,.5)&&number(c.critMultiplier,1,2.5));
 }
 for(const r of s.floors.flat())for(const e of r.enemies)if(e.utilityFrostTime!==undefined){check(number(e.utilityFrostTime,0,e.type==='boss'?1:2));if(e.utilityFrostTime>0)check(p.utility==='frostWave');}
}
