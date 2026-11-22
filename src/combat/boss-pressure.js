export const pressureBoss=e=>e.bossPressureVersion===1;
export function commanderOffsets(count){return count===2?[-.15,.15]:count===3?[-.23,0,.23]:Array.from({length:count},(_,i)=>(i-(count-1)/2)*.16);}
export function commanderProfile(e){
 const second=e.shadowBoss!==1&&e.hp/e.max<=.5;
 return pressureBoss(e)?{count:second?6:4,speed:second?380:342,move:second?125:100,windup:second?.48:.56,beat:second?.24:.28,recovery:second?.98:1.3,rainWindup:second?1:1.15,rain:second?10.4:15.6,blink:second?4.55:7.8,snipe:second?5.2:7.15,snipeWindup:second?.65:.75,snipeSpeed:second?494:456,reflectSpeed:second?418:380,reflectCount:second?4:2,reflect:second?4.16:6.5,reflectWindup:second?.6:.7}:{count:second?3:2,speed:290,move:second?64:56,windup:.7,beat:.35,recovery:1.76,rainWindup:1.3,rain:26,blink:13,snipe:second?7.8:9.36,snipeWindup:.9,snipeSpeed:440};
}
export const fastKing=e=>pressureBoss(e)&&e.variant==='king'&&(e.shadowBoss===1||e.hp/e.max<=.3);
// Shared by combat and presentation; values preserve the existing attack clocks.
export function upperAttackWindup(e,kind,{step=0,finisher=false}={}){
 const fast=fastKing(e),phase=e.hp/e.max>.65?1:e.hp/e.max>.3?2:3;
 if(e.gateTitle&&e.type==='starKnight'&&kind==='slash')return step>0?.2:.3;
 if(e.gateTitle&&e.type==='astralSniper'&&kind==='fan')return step>0?.55:.7;
 if(kind==='judgment')return step>0?(fast?.42:.65):(fast?.8:1.1);
 if(kind==='mark'&&finisher)return fast?.75:1.1;
 if(kind==='slash')return e.type==='boss'?(fast?.32:.5):step>0&&e.gateTitle&&e.type==='starKnight'?.2:.25;
 if(kind==='fan'&&e.variant==='king'&&phase===1&&step===1)return .28;
 return fast?.45:e.type==='astralSniper'?.6:e.variant==='king'&&phase>=2?.65:.85;
}
export function upperAttackProgress(e,a){return Math.max(0,Math.min(1,1-a.time/(a.warningDuration??upperAttackWindup(e,a.kind,a))));}
