import {highFloorEnemy,highFloorKinds,highStages} from '../combat/high-floor-profile.js';
export function validateHighFloorEnemy(e,check,number){
 function attack(a,flash=false){
  check(highFloorEnemy(e)&&a&&Object.hasOwn(highStages,a.kind)&&(a.kind===highFloorKinds[e.type]||e.type==='royalGuard'&&a.kind==='butt'));
  check(highStages[a.kind]?.includes(a.stage)&&number(a.time,0,flash?.18:1)&&number(a.duration,.12,1)&&number(a.aim,-Math.PI,Math.PI));
  check(a.time<=(flash?.18:a.duration)+1e-8);
  for(const k of ['x','tx','homeX','secondX'])check(number(a[k],0,960));for(const k of ['y','ty','homeY','secondY'])check(number(a[k],0,540));
  check([0,1].includes(a.step)&&typeof a.hit==='boolean'&&typeof a.close==='boolean');
 }
 if(e.highAttack!==undefined){check(!e.darkAttack&&!e.gravity&&!e.meleeAttack&&!e.phase&&!e.attackPhase);attack(e.highAttack);}
 if(e.highFlash!==undefined)attack(e.highFlash,true);
}
