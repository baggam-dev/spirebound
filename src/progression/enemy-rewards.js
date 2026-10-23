// Classification only: no RNG, mutation, collection or extra reward event.
export function enemyXpReward(e){
 if(e.summoned||e.type==='boss')return 0;
 // Tutorial and other explicitly authored awards retain their exact total.
 if(e.xpReward!==undefined)return e.xpReward;
 return e.gateTitle?36:e.trialChampion?24:e.elite?18:12;
}
export function enemyEssenceChance(e,room){
 const key=room.returnSeal==='guardian'&&Number.isInteger(room.returnGuardianId)&&room.returnGuardianId===e.id;
 if(key&&(room.finalApproachDepth===1||room.finalApproachDepth===2))return 1;
 if(e.gateTitle)return .25;
 if(e.trialChampion||key)return .1;
 return e.elite?.05:.005;
}
