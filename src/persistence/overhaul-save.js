export const legacyEvolution=(key,id)=>(key==='pierce'&&['depth','impact'].includes(id))||(key==='haste'&&['tempo','stride'].includes(id));
export function migrateIaidoState(s){
 if(s.player.evolutions?.rollMastery!=='slash')return;
 if(s.slashCharges===undefined){s.slashChargeRank=Math.max(1,Math.min(3,s.player.rollMastery||1));s.slashCharges=s.dodge>0?0:s.slashChargeRank;}
 // A saved input must not replay movement or deal the same cut again on reload.
 if(s.roll?.kind==='slash')delete s.roll;
}
export function validateOverhaul(s,check,number){
 const p=s.player;if(s.skillOverhaulVersion!==undefined)check(s.skillOverhaulVersion===1);
 for(const id of ['sunFairy','snowFairy','stormFairy','fairyKing'])if(p[id]!==undefined)check(p[id]===0||p[id]===1);
 if(p.rollMastery!==undefined)check(Number.isInteger(p.rollMastery)&&number(p.rollMastery,0,3)&&(p.rollMastery<=1||p.evolutions?.rollMastery==='slash'));
 if(s.slashCharges!==undefined||s.slashChargeRank!==undefined){check(p.evolutions?.rollMastery==='slash'&&Number.isInteger(s.slashCharges)&&Number.isInteger(s.slashChargeRank)&&number(s.slashChargeRank,1,Math.max(1,p.rollMastery||1))&&number(s.slashCharges,0,s.slashChargeRank));}
 if(p.lastMove!==undefined)check(number(p.lastMove.x,-1,1)&&number(p.lastMove.y,-1,1));
 if(s.roll){const q=s.roll;if(q.cutIndex!==undefined)check(Number.isInteger(q.cutIndex)&&number(q.cutIndex,0,2));if(q.impactCount!==undefined)check(Number.isInteger(q.impactCount)&&number(q.impactCount,0,4));check(number(q.x,-1,1)&&number(q.y,-1,1)&&number(q.elapsed,0,.35)&&number(q.duration,q.kind==='slash'?.08:.1,.35)&&q.elapsed<=q.duration&&number(q.distance,1,100000)&&number(q.damage,0,1e8)&&number(q.immune,0,.35));check(q.kind===null||['mines','swift','slash'].includes(q.kind));check(Array.isArray(q.hit)&&q.hit.length<=128&&q.hit.every(Number.isInteger)&&Number.isInteger(q.mines)&&number(q.mines,0,3)&&number(q.origin.x,0,960)&&number(q.origin.y,0,540));}
 for(const [key,max] of [['bloodTime',8],['bloodKills',4],['bloodHeals',2],['bloodCredits',1000],['fairyKingClock',3]])if(s[key]!==undefined)check(number(s[key],0,max));
 if(s.bloodBossHealth!==undefined){check(s.bloodBossHealth&&typeof s.bloodBossHealth==='object'&&!Array.isArray(s.bloodBossHealth)&&Object.keys(s.bloodBossHealth).length<=128);for(const h of Object.values(s.bloodBossHealth))check(number(h.hp,0,100000)&&number(h.max,1,100000));}
 for(const r of s.floors.flat()){
  if(r.rollMines!==undefined){check(Array.isArray(r.rollMines)&&r.rollMines.length<=9);for(const m of r.rollMines)check(number(m.x,0,960)&&number(m.y,0,540)&&number(m.time,0,3)&&number(m.damage,0,1e8));}
  if(r.fairyBeam){const b=r.fairyBeam;check(number(b.x,0,960)&&number(b.y,-50,590)&&number(b.aim,-Math.PI,Math.PI)&&number(b.time,0,.6)&&number(b.power,0,1e8));}
 }
}
