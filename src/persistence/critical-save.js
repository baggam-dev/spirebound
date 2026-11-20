import {validCriticalSnapshot} from '../combat/critical.js';
import {criticalSkills} from '../progression/critical-skills.js';

export function validateCriticalPlayer(p,check,number){
 if(p.critChance!==undefined)check(number(p.critChance,0,1));
 if(p.critMultiplier!==undefined)check(number(p.critMultiplier,1,10));
 if(p.judgmentEmpowered!==undefined)check(p.judgmentEmpowered===true);
}
export function validateCriticalSave(s,check,number){
 validateCriticalPlayer(s.player,check,number);
 for(const k of criticalSkills)if(s.player[k.id]!==undefined)check(Number.isInteger(s.player[k.id])&&number(s.player[k.id],0,k.max));
 for(const [key,max] of [['critFocusTime',3],['critFocusCooldown',8]])if(s.player[key]!==undefined)check(number(s.player[key],0,max));
 if(s.critical!==undefined){
  const c=s.critical;check(c&&typeof c==='object'&&!Array.isArray(c)&&c.version===1);
  for(const key of ['randomState','sequence'])check(Number.isInteger(c[key])&&number(c[key],0,4294967295));
  for(const key of ['hits','criticalHits'])check(Number.isInteger(c[key])&&number(c[key],0,1e12));
  for(const key of ['damage','criticalDamage'])check(number(c[key],0,1e12));
  check(c.criticalHits<=c.hits&&c.criticalDamage<=c.damage+Math.max(1e-6,c.damage*1e-12));
  if(c.royalCharges!==undefined)check(Number.isInteger(c.royalCharges)&&number(c.royalCharges,0,8));
  if(c.royalNextAt!==undefined)check(number(c.royalNextAt,0,1e9));
 }
 const snapshots=new Map();
 const inspect=value=>{
  if(value?.criticalSnapshot!==undefined){
   const snapshot=value.criticalSnapshot;check(validCriticalSnapshot(snapshot));check(!!s.critical&&snapshot.id<=s.critical.sequence);
   const previous=snapshots.get(snapshot.id);if(previous){check(previous.critical===snapshot.critical&&previous.multiplier===snapshot.multiplier);previous.countedTargets=new Set([...previous.countedTargets,...snapshot.countedTargets]);check(previous.countedTargets.size<=128);}else snapshots.set(snapshot.id,{critical:snapshot.critical,multiplier:snapshot.multiplier,countedTargets:new Set(snapshot.countedTargets)});
  }
  if(value?.criticalProfile!==undefined){check(value.criticalProfile&&typeof value.criticalProfile==='object'&&!Array.isArray(value.criticalProfile));check(number(value.criticalProfile.critChance,0,1)&&number(value.criticalProfile.critMultiplier,1,10));}
  if(value?.criticalProfile)validateCriticalPlayer(value.criticalProfile,check,number);
 };
 inspect(s.roll);
 for(const b of s.projectiles||[]){inspect(b);if(b.build)validateCriticalPlayer(b.build,check,number);if(b.weapon)validateCriticalPlayer(b.weapon,check,number);}
 for(const room of s.floors.flat()){
  for(const value of [room.arrowRain,room.fairyBeam,room.allyZone,...(room.fireZones||[]),...(room.rollMines||[])])inspect(value);
  for(const t of room.turrets||[])if(t.build)validateCriticalPlayer(t.build,check,number);
  for(const e of room.enemies||[]){
   if(e.critMarkTime!==undefined)check(number(e.critMarkTime,0,2));
   if(e.critMarkPower!==undefined)check([.05,.08,.1].includes(e.critMarkPower));
   if(e.critMarkAttack!==undefined)check(Number.isInteger(e.critMarkAttack)&&number(e.critMarkAttack,1,s.critical?.sequence??0));
   if(e.critMarkTime>0)check(e.critMarkPower!==undefined&&e.critMarkAttack!==undefined);
   if(e.frostWeapon)validateCriticalPlayer(e.frostWeapon,check,number);
   for(const value of [e,e.burnField,e.pendingFireField,e.sporeDot,e.fairyBurn,e.bladeDot,e.poisonGasCritical,e.poisonBlastCritical,...(e.burnStacks||[]),...(e.poisonStacks||[])])inspect(value);
   if(e.burnComponents!==undefined){check(Array.isArray(e.burnComponents)&&e.burnComponents.length<=128);for(const part of e.burnComponents){check(number(part.amount,0,10000));inspect(part);}}
  }
 }
}
