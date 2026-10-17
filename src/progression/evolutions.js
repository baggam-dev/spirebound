export const evolutions={
 rollMastery:[{id:'mines',name:'잔영 지뢰',description:'구르기 거리 +20% · 경로에 3초 후 폭발하는 150% 지뢰 3개'},{id:'swift',name:'질풍 회피',description:'구르기 속도 +25% · 재사용 0.5초 감소'},{id:'slash',name:'일섬',description:'발도 돌진 · 경로의 적을 평타 300%로 한 번 베기'}],
 aura:[{id:'judgment',name:'단죄의 칼날',description:'베르가스 단발 피해 +20% · 사거리 200 · 넓은 베기 · 재사용 25% 증가'},{id:'dance',name:'집요한 검무',description:'베르가스 50% 피해로 2회 베기 · 재사용 동일 · 2타 전 대상 재확인'}],
 split:[{id:'fan',name:'넓은 부채',description:'넓게 퍼지는 추가탄 · 추가탄 피해 50%'},{id:'focus',name:'집중 사격',description:'좁은 탄 간격 · 공격 간격 15% 증가'}],
 fire:[{id:'ember',name:'확산 폭발',description:'폭발/장판 범위 +30% · 폭발 피해 -5%'},{id:'flare',name:'응축 폭발',description:'폭발 피해 +25% · 장판 지속 1초'}],
 poison:[{id:'ember',name:'잔류 독',description:'독 4.5초 · 중첩당 초당 피해 -5%'},{id:'flare',name:'맹독',description:'중첩당 초당 피해 +25% · 독 지속 2초'}],
 frost:[{id:'deep',name:'깊은 서리',description:'둔화율 +20%p · 지속시간 1.5초'},{id:'lasting',name:'잔류 서리',description:'둔화 4초 · 둔화율 5%p 감소'}],
 chain:[{id:'surge',name:'집중 방전',description:'직격 추가 번개 75% · 전이 1체에 120% 피해'},{id:'web',name:'번개 그물',description:'전이 +2 · 첫 전이 65%, 이후 90% 유지'}],
 precision:[{id:'sniper',name:'집중 저격',description:'같은 적을 두 번 맞히면 다음 정밀탄 강화 · 강화탄 피해 +110%'},{id:'execution',name:'결정 사격',description:'체력 35% 이하 적에게 주는 정밀 직격 피해 +35%'}],
 ultimate:[{id:'burst',name:'화살비',description:'반경 280 고정 영역 · 0.3초 간격 평타 700%씩 6회 · 재사용 25초'},{id:'turret',name:'자동 저격 석궁',description:'14초 유지 · 사거리 308 · 0.6초마다 설치 시 공격력 100%·속성/갈래/관통/연속/유도 계승(요정 제외) · 최대 2대 · 재사용 20초'}]
};
export function pendingEvolution(p){if(p.ultimate===1&&!p.evolutions?.ultimate)return 'ultimate';return Object.keys(evolutions).find(k=>!p.evolutions?.[k]&&(k==='ultimate'?p.ultimate===1:k==='rollMastery'?p.rollMastery===1:(p[k]||0)>=3));}
export function chooseEvolution(p,key,id){if(pendingEvolution(p)!==key||!evolutions[key]?.some(e=>e.id===id))return false;(p.evolutions??={})[key]=id;return true;}
export function evolutionSummary(p){return Object.entries(p.evolutions||{}).map(([k,id])=>evolutions[k]?.find(e=>e.id===id)?.name).filter(Boolean).join(' / ')||'없음';}
