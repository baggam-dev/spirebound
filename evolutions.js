import {skillPoints} from './skill-tree.js';
export const evolutions={
 split:[{id:'fan',name:'넓은 부채',description:'넓게 퍼지는 추가탄 · 추가탄 피해 50%'},{id:'focus',name:'집중 사격',description:'좁은 탄 간격 · 공격 간격 15% 증가'}],
 pierce:[{id:'depth',name:'심층 관통',description:'관통 +2 · 직격 피해 15% 감소'},{id:'impact',name:'충격 화살',description:'관통 제거 · 직격 피해 25% 증가'}],
 haste:[{id:'tempo',name:'고속 리듬',description:'공격 간격 15% 감소 · 직격 피해 15% 감소'},{id:'stride',name:'기동 사냥',description:'이동 중 이동속도 +12% · 기본 공격속도 유지'}],
 fire:[{id:'ember',name:'확산 폭발',description:'폭발/장판 범위 +20% · 폭발 피해 -15%'},{id:'flare',name:'응축 폭발',description:'폭발 피해 +25% · 장판 지속 1초'}],
 poison:[{id:'ember',name:'잔류 독',description:'독 4.5초 · 중첩당 초당 피해 -20%'},{id:'flare',name:'맹독',description:'중첩당 초당 피해 +25% · 독 지속 2초'}],
 frost:[{id:'deep',name:'깊은 서리',description:'둔화율 +15% · 지속시간 1초'},{id:'lasting',name:'잔류 서리',description:'둔화 4초 · 둔화율 10% 감소'}],
 chain:[{id:'surge',name:'집중 방전',description:'전이 1회 · 첫 전이 피해 65%'},{id:'web',name:'번개 그물',description:'전이 +2 · 첫 전이 20%, 이후 45%씩 감쇠'}],
 ultimate:[{id:'burst',name:'집중 화살비',description:'방 전체 즉시 120 피해 · 재사용 25초'},{id:'field',name:'잔류 화살비',description:'현재 위치에 5초 영역 · 초당 40 피해 · 재사용 25초'}]
};
export function pendingEvolution(p){return Object.keys(evolutions).find(k=>!p.evolutions?.[k]&&(k==='ultimate'?skillPoints(p)>=5:(p[k]||0)>=3));}
export function chooseEvolution(p,key,id){if(pendingEvolution(p)!==key||!evolutions[key]?.some(e=>e.id===id))return false;(p.evolutions??={})[key]=id;return true;}
export function evolutionSummary(p){return Object.entries(p.evolutions||{}).map(([k,id])=>evolutions[k]?.find(e=>e.id===id)?.name).filter(Boolean).join(' / ')||'없음';}
