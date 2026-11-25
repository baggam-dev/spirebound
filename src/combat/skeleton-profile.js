export const skeletonTypes=['skeletonWarrior','skeletonArcher'];
export const isSkeleton=e=>skeletonTypes.includes(e?.type);
export const SKELETON=Object.freeze({warriorHp:900,archerHp:650,warriorSpeed:160,archerSpeed:170,eliteCap:3,roomCap:64,projectileCap:36,portalWarning:.8,slashRange:68,slashHalfAngle:.8,dashSpeed:360,dashDuration:.36,dashRadius:32});
export const skeletonWave=phase=>({interval:phase===3?3:5,count:phase===1?1:phase===2?2:4,cap:[0,4,6,12][phase]});
