// Definitions and pure callbacks only: no combat/progression import cycle.
export const criticalRelics=[
 {id:'hawkCharm',name:'매의 눈 장식',description:'치명타 확률 +5%p',stats:{critChance:.05}},
 {id:'crackedCrown',name:'금 간 왕관',description:'최대 체력 -1 · 치명타 확률 +8%p / 피해 배율 +20%p · 최대 체력 2 이상 필요',grade:'rare',weight:.6,stats:{critChance:.08,critMultiplier:.2}},
 {id:'hunterSeal',name:'사냥꾼의 인장',description:'보스·정예에게 새 치명타 시 추가 피해 20% · 기본 공격력 40% 한도 · 재사용 1초 · 지속 틱/파생 제외',grade:'rare',weight:.6,stats:{}},
 {id:'resolveEmblem',name:'불굴의 문장',description:'새 비치명타마다 치명타 확률 +2%p, 최대 +10%p · 치명타 후 초기화 · 증가 간격 0.25초 · 지속 틱/파생 제외',stats:{}}
];
export const criticalRelicIds=criticalRelics.map(r=>r.id);
export const ownsCriticalRelic=(p,id)=>p?.relics?.includes(id)||p?.relic===id;
export function criticalRelicBonuses(p){
 let chance=0,multiplier=0;for(const r of criticalRelics)if(ownsCriticalRelic(p,r.id)){chance+=r.stats.critChance||0;multiplier+=r.stats.critMultiplier||0;}
 return {chance,multiplier};
}
export const resolveChance=p=>ownsCriticalRelic(p,'resolveEmblem')?.02*Math.min(5,p.resolveStacks||0):0;
export function criticalRelicHit(s,e,result,addDamage){
 if(!result.procEligible)return;
 const p=s.player,now=s.elapsed||0;
 if(ownsCriticalRelic(p,'resolveEmblem')){
  if(result.critical)p.resolveStacks=0;
  else if(now>=(p.resolveNextAt??0)){p.resolveStacks=Math.min(5,(p.resolveStacks||0)+1);p.resolveNextAt=now+.25;}
 }
 if(result.critical&&e.hp>0&&(e.type==='boss'||e.elite)&&ownsCriticalRelic(p,'hunterSeal')&&now>=(s.critical.hunterNextAt??0)){
  s.critical.hunterNextAt=now+1;
  addDamage(Math.min(result.criticalDamage*.2,p.damage*.4));
 }
}
