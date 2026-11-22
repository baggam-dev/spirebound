import {REMNANT_PARTS,remnantReachableRooms} from '../world/remnant-hunt.js';
export function validateRemnantHunt(s,check,number){
 const rooms=s.floors[7],marked=s.floors.flat().filter(r=>r.remnantSeal||r.remnantPart||r.remnantBattle||r.enemies.some(e=>e.remnantHuntVersion!==undefined));
 if(s.remnantHuntVersion===undefined){check(marked.length===0);return;}
 check(s.remnantHuntVersion===1&&s.bossLayoutVersion===1&&!!rooms);
 const boss=rooms.find(r=>r.type==='boss'),seal=boss?.remnantSeal;
 check(seal?.version===1&&Array.isArray(seal.rooms)&&seal.rooms.length===5&&new Set(seal.rooms).size===5);
 const reachable=remnantReachableRooms(rooms);
 check(seal.rooms.every(i=>Number.isInteger(i)&&reachable.includes(i)));
 check(Array.isArray(seal.defeated)&&seal.defeated.length<=5&&new Set(seal.defeated).size===seal.defeated.length&&seal.defeated.every(p=>REMNANT_PARTS.includes(p)));
 check(marked.every(r=>rooms.includes(r)&&(r===boss||seal.rooms.includes(rooms.indexOf(r)))));
 for(const [i,index] of seal.rooms.entries()){
  const r=rooms[index],part=REMNANT_PARTS[i];check(r.remnantPart===part&&r.type==='normal'&&!!r.remnantBattle);
  const defeated=seal.defeated.includes(part);check(['hunt','done'].includes(r.remnantBattle.stage)&&defeated===(r.remnantBattle.stage==='done'));
  if(!s.key)check(defeated?r.used&&!r.enemies.length:!r.used&&r.enemies.length===1&&r.enemies[0].part===part);
 }
 if(!boss.demonPending){check(seal.defeated.length===5&&!!boss.remnantBattle&&['whole','split','done'].includes(boss.remnantBattle.stage));check(boss.used===(boss.remnantBattle.stage==='done'));}
 else check(!boss.used&&!boss.remnantBattle&&boss.enemies.length===0);
 if(s.key)check(boss.used&&seal.defeated.length===5);
 for(const r of marked){
  if(r.remnantSeal)check(r===boss);
  const d=r.remnantBattle;if(!d)continue;
  check(['hunt','whole','split','done'].includes(d.stage)&&Number.isSafeInteger(d.turn)&&number(d.turn,0,1000000));
  check(Array.isArray(d.attacks)&&d.attacks.length<=2&&Array.isArray(d.flashes)&&d.flashes.length<=5&&d.partClocks&&typeof d.partClocks==='object'&&!Array.isArray(d.partClocks));
  for(const [part,n] of Object.entries(d.partClocks))check([...REMNANT_PARTS,'core'].includes(part)&&number(n,0,3));
  const actors=r.enemies.filter(e=>e.remnantHuntVersion===1);check(new Set(actors.map(e=>e.part)).size===actors.length);
  check(!r.demon);if(d.stage!=='done')check(actors.length===r.enemies.length);
  if(d.stage==='hunt')check(r!==boss&&actors.length===1&&actors[0].part===r.remnantPart);
  if(d.stage==='whole')check(actors.length===1&&actors[0].part==='core');
  if(d.stage==='split')check(actors.length>=1&&actors.length<=5&&actors.every(e=>REMNANT_PARTS.includes(e.part)));
  if(d.stage==='done')check(actors.length===0&&d.attacks.length===0&&d.flashes.length===0);
  for(const e of r.enemies)if(e.remnantHuntVersion!==undefined)check(e.remnantHuntVersion===1&&e.type==='boss'&&e.variant==='demon'&&e.remnantVersion===1&&[...REMNANT_PARTS,'core'].includes(e.part));
  check(new Set(d.attacks.map(a=>a.owner)).size===d.attacks.length);
  for(const a of [...d.attacks,...d.flashes]){
   check([...REMNANT_PARTS,'core'].includes(a.owner)&&['cleave','stomp','rush','nova','fan','ray'].includes(a.kind)&&number(a.time,0,1.1)&&number(a.duration,.85,1.1));
   check(({core:['cleave','stomp','rush','nova'],hand:['fan'],foot:['rush','stomp'],eye:['ray'],nose:['rush'],mouth:['fan']})[a.owner].includes(a.kind));
   check(a.duration===(a.kind==='rush'?1:a.kind==='ray'?1.1:.85));
   for(const key of ['x','tx'])check(number(a[key],0,960));for(const key of ['y','ty'])check(number(a[key],0,540));check(number(a.aim,-Math.PI,Math.PI));
   if(d.attacks.includes(a))check(actors.some(e=>e.part===a.owner)&&a.time<=a.duration);
  }
 }
}
