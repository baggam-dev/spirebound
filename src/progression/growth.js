// Repeatable rewards only replace an exhausted skill pool.
export const growthRewards=[
 {id:'growthPower',name:'꾸준한 연마',description:'기본 공격력 +2',icon:'power',grade:'normal',growth:true},
 {id:'growthHealth',name:'강인한 생명',description:'최대 체력 +1칸 · 체력 1칸 회복',icon:'aura',grade:'normal',growth:true},
 {id:'growthHaste',name:'익숙한 사격',description:'추가 공격 속도 +3%',icon:'haste',grade:'normal',growth:true},
];
export function growthAvailable(p,k){return k.id==='growthPower'?p.damage<10000:k.id==='growthHealth'?p.max<1000:k.id==='growthHaste'?(p.bonusAttack||0)<100:false;}
export function applyGrowth(p,id){const k=growthRewards.find(k=>k.id===id);if(!k||!growthAvailable(p,k))return false;if(id==='growthPower')p.damage=Math.min(10000,p.damage+2);if(id==='growthHealth'){p.max++;p.hp=Math.min(p.max,p.hp+1);}if(id==='growthHaste')p.bonusAttack=Math.min(100,(p.bonusAttack||0)+.03);return true;}
