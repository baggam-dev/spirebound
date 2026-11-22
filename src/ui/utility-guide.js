import {utilitySkills,utilityUseState} from '../combat/utility.js';
import {utilityCooldown} from '../progression/relics.js';
const seconds=n=>(Math.ceil(Math.max(0,n||0)*10)/10).toFixed(1)+'초';
const tips={
 focus:'체력이 여유로울 때 사용 · 1하트를 소모하고 7초간 공격·이동 속도가 증가합니다.',
 firstAid:'적을 처치하거나 보스에 피해를 줄 때 회복 · 만피에도 회복 기회는 소모됩니다.',
 guardian:'위험한 공격 전에 사용 · 10초 안에 피격 1회를 방어합니다.',
 frostWave:'적이 가까이 모였을 때 사용 · 주변 120 범위를 공격하고 둔화합니다.',
 thunderSigil:'가까운 지상 적을 지정 · 인장은 적을 따라가지 않고 지정 위치에 0.65초 뒤 떨어집니다.',
 galeVeil:'탄을 통과하거나 거리를 벌릴 때 사용 · 일반 적탄 최대 2개만 소거하며 빔·장판·반사탄은 막지 못합니다.'
};
export function utilityGuide(s,{paused=false}={}){
 const state=utilityUseState(s),p=s?.player||{},skill=utilitySkills.find(k=>k.id===p.utility);
 let active='';
 if(p.utility==='focus'&&p.focusTime>0)active='각성 '+seconds(p.focusTime);
 if(p.utility==='firstAid'&&s.bloodTime>0)active='계약 '+seconds(s.bloodTime)+' · 회복 '+Math.min(2,s.bloodHeals||0)+'/2회'+((s.bloodHeals||0)>=2?' 소진':' 사용');
 if(p.utility==='guardian'&&s.guardianTime>0&&s.guardianCharges>0)active='보호 '+seconds(s.guardianTime)+' · 방어 '+s.guardianCharges+'회 남음';
 if(p.utility==='galeVeil'&&p.galeTime>0)active='이속 증가 '+seconds(p.galeTime)+' · '+(p.galeCharges>0?'탄 소거 '+p.galeCharges+'회 남음':'탄 소거 소진');
 if(s?.utilityCast?.id===p.utility)active=p.utility==='thunderSigil'?'인장 낙뢰까지 '+seconds(s.utilityCast.remaining):'서리파동 발동 중';
 const short=paused?'일시정지':state.short,reason=paused&&state.ready?'탐험을 재개하면 사용할 수 있습니다.':state.reason;
 const cooldown=skill?utilityCooldown(p,skill.id):0;
 const status=[reason,active,s?.utilityCooldown>0&&state.code!=='cooldown'?'재사용 '+seconds(s.utilityCooldown):''].filter(Boolean).join(' · ');
 return {...state,short,name:skill?.name||'액티브',active,status,tip:tips[p.utility]||'레벨5와 보스1회 처치 후 액티브 룰렛으로 획득합니다.',description:skill?.description.replace(/재사용 \d+초/,'재사용 '+Number(cooldown.toFixed(2))+'초')||'',label:[skill?.name||'액티브',status,tips[p.utility]].filter(Boolean).join(' · ')};
}
