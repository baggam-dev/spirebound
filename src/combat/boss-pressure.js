export const pressureBoss=e=>e.bossPressureVersion===1;
export function commanderOffsets(count){return count===2?[-.15,.15]:count===3?[-.23,0,.23]:Array.from({length:count},(_,i)=>(i-(count-1)/2)*.16);}
export function commanderProfile(e){
 const second=e.hp/e.max<=.5;
 return pressureBoss(e)?{count:second?6:4,speed:second?380:342,move:second?125:100,windup:second?.48:.56,beat:second?.24:.28,recovery:second?.98:1.3,rainWindup:second?1:1.15,rain:second?10.4:15.6,blink:second?4.55:7.8,snipe:second?5.2:7.15,snipeWindup:second?.65:.75,snipeSpeed:second?494:456,reflectSpeed:second?418:380,reflectCount:second?4:2,reflect:second?4.16:6.5,reflectWindup:second?.6:.7}:{count:second?3:2,speed:290,move:second?64:56,windup:.7,beat:.35,recovery:1.76,rainWindup:1.3,rain:26,blink:13,snipe:second?7.8:9.36,snipeWindup:.9,snipeSpeed:440};
}
export const fastKing=e=>pressureBoss(e)&&e.variant==='king'&&e.hp/e.max<=.3;
