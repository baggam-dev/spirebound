import {grantRelic,removeRelic,relicInfo,relicStat,movementSpeed,ultimateCooldown,dodgeCooldown,blinkDistance} from './relics.js';
import {previewStats} from './skill-preview.js';
import {shieldCooldown} from './survival.js';

function values(p){const a=previewStats(p);return {
 '첫 적중 피해¹':a.hit,'초당 사격':a.rate,'이동속도':movementSpeed(p),'최대 체력':p.max,
 '현재 체력':p.hp,'궁극기 재사용(초)':p.ultimate?ultimateCooldown(p):null,
 '점멸 재사용(초)':dodgeCooldown(p),'점멸 거리':blinkDistance(p),
 '장비 보호막 충전(초)':p.armor?shieldCooldown(p):null,
 '오라 초당 피해':a.aura,'오라 반경':a.auraRadius,
 '오라 보호막 충전(초)':p.aura>=3?60-relicStat(p,'auraShield'):null,
 '화상 1중첩 / 초':a.burn,'독 1중첩 / 초':a.poison};}
export function relicRequirements(p,id){const stats=relicInfo(id)?.stats||{},notes=[];
 if(stats.shield&&!p.armor)notes.push('장비 보호막 획득 후 적용');
 if((stats.ultimateCooldown||stats.ultimateDamage)&&!p.ultimate)notes.push('궁극기 습득 후 적용');
 if((stats.auraDamage||stats.auraRange)&&!p.aura)notes.push('근접 오라 습득 후 적용');
 if(stats.auraShield&&!(p.aura>=3))notes.push('근접 오라 3레벨 필요');
 if(stats.fire&&!p.fire)notes.push('화염 화살 필요');
 if(stats.dot&&!(p.fire>=2||p.poison))notes.push('화염 화살 2레벨 또는 독 화살 필요');
 if(stats.element&&!(p.fire||p.poison||p.frost||p.chain))notes.push('속성 화살 습득 후 적용');
 if(id==='lens')notes.push('거리 280 이상 적에게 적용');
 if(id==='hunter')notes.push('보스에게만 적용');
 if(id==='execution')notes.push('적 체력 30% 이하일 때 적용');
 return notes;
}
export function relicPreview(p,id,removeId=null){
 const next=structuredClone(p);if(removeId&&!removeRelic(next,removeId))return {rows:[],notes:[]};
 if(!grantRelic(next,id))return {rows:[],notes:[]};
 const before=values(p),after=values(next),rows=Object.keys(before).filter(k=>before[k]!==null&&after[k]!==null&&Math.abs(before[k]-after[k])>.0001).map(label=>({label,before:before[label],after:after[label]}));
 return {rows,notes:relicRequirements(next,id)};
}
export function relicPreviewMarkup(p,id,removeId=null){const {rows,notes}=relicPreview(p,id,removeId);const fmt=n=>Number.isInteger(n)?String(n):n.toFixed(2);
 return '<span class="skill-preview">'+(removeId?'<span>잃는 효과<strong>'+relicInfo(removeId).description+'</strong></span><span>얻는 효과<strong>'+relicInfo(id).description+'</strong></span>':'')+rows.map(r=>'<span>'+r.label+'<strong>'+fmt(r.before)+' → '+fmt(r.after)+'</strong></span>').join('')+notes.map(n=>'<span>'+n+'</span>').join('')+(rows.some(r=>r.label.includes('¹'))?'<small>¹ 거리 100 · 체력 가득 찬 일반 적. 지속·전이 피해 제외.</small>':'')+(!rows.length&&!notes.length&&!removeId?'<span>효과: '+relicInfo(id).description+'</span>':'')+'</span>';
}
