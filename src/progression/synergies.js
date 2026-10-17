// Shared data for eligibility, snapshots, combat and exact level previews.
export const synergySkills=[
 {id:'blastTip',main:'fire',name:'화약촉',icon:'fire',brief:'폭발 중심에 있는 적을 더 강하게 타격합니다.',steps:['중심 35% · 폭발 피해 +10%','중심 35% · 폭발 피해 +20%','중심 50% · 폭발 피해 +20%']},
 {id:'emberMark',main:'fire',requires:2,name:'잔불의 낙인',icon:'fire',brief:'화상 3중첩 적을 다시 맞히면 연소 피해를 줍니다.',steps:['폭발 기준 15% · 대상별 2초','폭발 기준 30% · 대상별 2초','폭발 기준 30% · 대상별 1.4초']},
 {id:'frostBond',main:'frost',name:'서리 응집',icon:'frost',brief:'서리 중첩을 오래 유지하고 둔화 효과를 강화합니다.',steps:['중첩 유지 3초 → 4초','중첩 4초 · 이동 둔화 +5%p','위 효과 · 해빙 후 1초간 15% 둔화']},
 {id:'shardHone',main:'frost',name:'빙편 연마',icon:'frost',brief:'사망 파편의 위력과 비행 거리를 강화합니다.',steps:['파편 피해 +15%','파편 피해 +20% · 수명 2.3초','일반 파편 +20% · 빙결 사망 파편 +30% · 2.3초']},
 {id:'venomPenetration',main:'poison',name:'침투 독',icon:'poison',brief:'독을 오래 남기고 주탄으로 중첩을 빠르게 쌓습니다.',steps:['독 지속 +0.5초','지속 +0.5초 · 독 피해 +10%','위 효과 · 기존 감염 적 주탄 추가 1중첩 / 1.5초']},
 {id:'plagueSpore',main:'poison',requires:2,name:'역병 포자',icon:'poison',brief:'독가스 안의 미감염 적에게 약한 독을 전파합니다.',steps:['거리 48 · 1체 · 독 50% · 1.5초 / 감염원 2초','거리 48 · 2체 · 독 50% · 1.5초 / 감염원 2초','거리 72 · 2체 · 독 50% · 1.5초 / 감염원 2초']},
 {id:'chargeCell',main:'chain',name:'축전',icon:'chain',brief:'주탄을 적중시켜 다음 직격 번개를 충전합니다.',steps:['주탄 4회 후 다음 직격 번개 +25%p','주탄 4회 후 다음 직격 번개 +40%p','주탄 3회 후 다음 직격 번개 +40%p']},
 {id:'conduction',main:'chain',name:'전도',icon:'chain',brief:'번개가 멀리 이어지고 후반 전이의 위력을 유지합니다.',steps:['감쇠 +3%p · 집중 방전은 첫 전이 +6%','위 효과 · 연결 거리 +20','위 효과 · 마지막 전이 피해 +15%']}
].map(k=>({...k,max:3,description:k.steps.join(' → ')}));
export const synergyIds=synergySkills.map(k=>k.id);
export const synergyInfo=id=>synergySkills.find(k=>k.id===id);
export const exclusiveMain=id=>synergyInfo(id)?.main||(['weakpoint','finisher'].includes(id)?'precision':null);
export function synergyAllowed(p,id){const k=synergyInfo(id),main=exclusiveMain(id);return !main||p.mainSkill===main&&(!k||(p[main]||0)>=(k.requires||1));}
export const synergyStep=(p,id)=>synergyInfo(id)?.steps[Math.min(3,p[id]||0)-1]||'미습득';
export const shardMultiplier=(p,frozen)=>p.shardHone>=3&&frozen?1.3:p.shardHone>=2?1.2:p.shardHone?1.15:1;
