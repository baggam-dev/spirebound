// New expeditions opt in explicitly. Legacy saves keep their original bosses.
export const revisedBosses=s=>s?.bossLayoutVersion===1;
export const demonFloor=s=>revisedBosses(s)?7:9;
export const kingFloor=s=>revisedBosses(s)?9:7;
export function configureBossLayout(s){
 if(!revisedBosses(s))return;
 const remnant=s.floors[7]?.find(r=>r.type==='boss');
 if(remnant){delete remnant.kingPending;remnant.demonPending=true;remnant.obstacles=[];}
 const king=s.floors[9]?.find(r=>r.type==='boss');
 if(king){delete king.demonPending;king.kingPending=true;}
}
export function finalBossDefeated(s){
 const r=s.floors.at(-1)?.find(r=>r.type==='boss');
 return !!(r?.used&&(revisedBosses(s)?s.campaign==='expanded'?r.kingPending===false:r.demonPending===false:s.campaign==='expanded'?r.demonPending===false:r.kingPending===false));
}
