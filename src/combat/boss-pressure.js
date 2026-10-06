export const pressureBoss=e=>e.bossPressureVersion===1;
export function commanderOffsets(count){return count===2?[-.15,.15]:count===3?[-.23,0,.23]:Array.from({length:count},(_,i)=>(i-(count-1)/2)*.16);}
export function commanderProfile(e){
 const second=e.hp/e.max<=.5;
 return pressureBoss(e)?{count:second?6:4,speed:second?400:360,move:second?125:100,windup:second?.34:.42,beat:second?.16:.2,recovery:second?.75:1,rainWindup:second?.75:.9,rain:second?8:12,blink:second?3.5:6,snipe:second?4:5.5,snipeWindup:second?.45:.55,snipeSpeed:second?520:480,reflectCount:second?4:2,reflect:second?3.2:5,reflectWindup:second?.4:.5}:{count:second?3:2,speed:290,move:second?64:56,windup:.55,beat:.27,recovery:1.35,rainWindup:1.05,rain:20,blink:10,snipe:second?6:7.2,snipeWindup:.72,snipeSpeed:440};
}
export const fastKing=e=>pressureBoss(e)&&e.variant==='king'&&e.hp/e.max<=.3;
