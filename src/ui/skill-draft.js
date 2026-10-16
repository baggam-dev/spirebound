import {skills,combinations} from '../progression/progression.js';
import {mainSkills,gradeLabels} from '../progression/skill-tree.js';
import {synergyInfo,synergySkills,exclusiveMain} from '../progression/synergies.js';
import {evolutions} from '../progression/evolutions.js';
import {skillPreview} from './skill-preview.js';
import {iconSVG} from '../rendering/pixel-icons.js';
import {recipePreviewMarkup} from './recipe-preview.js';

const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const mainBrief={fire:'느리고 강한 폭발로 적을 태웁니다.',frost:'서리를 쌓아 얼리고 사망 파편으로 이어갑니다.',poison:'독을 누적하고 가스와 처치 확산으로 번집니다.',chain:'직격 번개와 연쇄 전이로 여러 적을 공격합니다.',precision:'같은 적에게 집중해 강화탄으로 마무리합니다.'};
const briefs={split:'화살을 갈라 여러 방향을 동시에 공격합니다.',pierce:'앞의 적을 뚫고 뒤의 적까지 공격합니다.',haste:'화살 사이의 공격 공백을 줄입니다.',power:'직격과 속성 피해를 함께 높입니다.',repeat:'첫 화살 뒤에 같은 방향으로 한 발 더 쏩니다.',aura:'다가오는 적을 베고 곁으로 돌아옵니다.',homing:'적을 따라가는 별도 무속성 화살을 발사합니다.',weakpoint:'같은 적에게 이어지는 일반 주탄이 강해집니다.',finisher:'체력 35% 이하 적에게 주탄이 강해집니다.',ultimate:'화살비 또는 자동 저격 석궁을 선택합니다.'};
export function draftMarkup(s,choices,main=false){
 const p=s.player,selected=skills.find(k=>k.id===p.mainSkill),branch=evolutions[p.mainSkill]?.find(k=>k.id===p.evolutions?.[p.mainSkill]);
 const previewPlayer=main?{...p,...Object.fromEntries(mainSkills.map(id=>[id,0]))}:p;
 const cards=choices.map((k,i)=>{
  const own=p[k.id]||0,syn=synergyInfo(k.id),linked=exclusiveMain(k.id),grade=k.growth?'추가 성장':linked?'메인 전용':gradeLabels[k.grade];
  const rows=skillPreview(previewPlayer,k.id),core=syn?syn.steps[own]:rows.slice(0,2).map(r=>r.label+' '+r.before+' → '+r.after).join(' · ');
  const note=main?'전용 보조 2종 · 성장 분기 2종':linked?(selected?.name||'메인')+'과 연계':k.id==='aura'?'유니크 · 근접 위협 대응':k.id==='repeat'?'공격 공백 보완':'현재 빌드에 자유롭게 조합';
  return `<button class="draft-card skill-${k.grade||'normal'}" id="${main?'main-'+k.id:'u'+i}" data-draft-choice="${i}" aria-label="${esc(k.name)} ${main?'메인 선택':own?'레벨 '+own+'에서 '+(own+1)+'로 강화':'신규 습득'}"><span class="draft-number" aria-hidden="true">${i+1}</span>${iconSVG(k.icon||k.id)}<span class="draft-grade">${esc(grade)}</span><b>${esc(k.name)}</b><span class="draft-level">${main?'이번 도전의 메인':k.growth?'추가 성장':own?'Lv.'+own+' → Lv.'+(own+1):'신규 습득'}</span><span class="draft-brief">${esc(main?mainBrief[k.id]:syn?.brief||briefs[k.id]||k.description)}</span><strong class="draft-delta">${esc(core||k.description)}</strong><span class="draft-link">${esc(note)}</span>${main?'':recipePreviewMarkup(p,k.id)}</button>`;
 }).join('');
 const detailIds=main?choices.map(k=>k.id):[p.mainSkill];
 const details=detailIds.map(id=>{const k=skills.find(k=>k.id===id),supports=[...synergySkills.filter(n=>n.main===id),...skills.filter(n=>['weakpoint','finisher'].includes(n.id)&&id==='precision')];return `<article><h3>${esc(k.name)}</h3><p>${esc(k.description)}</p>${supports.map(n=>`<p><b>${esc(n.name)}</b> · 현재 Lv.${p[n.id]||0}<br>${esc(n.description)}</p>`).join('')}<p>분기 · ${(evolutions[id]||[]).map(n=>esc(n.name)+' — '+esc(n.description)).join('<br>')}</p></article>`;}).join('');
 const choiceDetails=choices.map(k=>`<article><h3>${esc(k.name)}</h3><p>${esc(k.description)}</p>${skillPreview(p,k.id).map(r=>`<p>${esc(r.label)} · ${esc(r.before)} → ${esc(r.after)}</p>`).join('')}</article>`).join('');
 return `<section class="skill-draft" aria-labelledby="draftTitle"><header class="draft-header"><small>LV ${p.level}</small><h2 id="draftTitle">${main?'주력 사격을 선택하세요':'새로운 깨달음'}</h2><div class="draft-build"><span>${main?'무작위 메인 3종 중 하나':esc('메인 · '+(selected?.name||'미선택'))}</span>${branch?'<span>'+esc(branch.name)+'</span>':''}${combinations(p).map(c=>'<span>'+esc(c.name)+'</span>').join('')}</div></header><div class="draft-cards">${cards}</div><footer class="draft-footer"><button id="${main?'rerollMain':'reroll'}" ${(s.rerolls??1)<=0||choices.every(k=>k.growth)?'disabled':''}>후보 새로고침 · ${s.rerolls??1}회</button><span>메인·보조 재추첨 횟수 공유 · 선택 즉시 확정</span></footer><details class="draft-details" id="skillDetails"><summary>상세 성장 보기</summary><div>${main?'':choiceDetails}${details}<p>궁극기는 5·10레벨 미습득 시 확정 후보, 그 외 5레벨 이후 30% 확률입니다. 전용 보조는 해당 메인에서만 등장합니다. 첫 적중 피해는 거리100의 체력 가득 찬 일반 적 기준이며 조건부·지속·전이 효과는 별도입니다.</p></div></details></section>`;
}
export function mountDraft(root){
 root.classList.add('skill-draft-panel');
 root.setAttribute('aria-labelledby','draftTitle');
 const cards=[...root.querySelectorAll('[data-draft-choice]')];
 root.addEventListener('keydown',event=>{
  if(event.ctrlKey||event.metaKey||event.altKey)return;
  const detail=root.querySelector('#skillDetails');
  if(event.key==='Escape'&&detail?.open){detail.open=false;detail.querySelector('summary').focus();event.preventDefault();event.stopPropagation();return;}
  if(detail?.open)return;
  if(['1','2','3'].includes(event.key)&&!event.repeat){event.preventDefault();event.stopPropagation();cards[Number(event.key)-1]?.click();}
  if(['ArrowLeft','ArrowRight'].includes(event.key)){const index=cards.indexOf(document.activeElement);if(index>=0){event.preventDefault();cards[(index+(event.key==='ArrowRight'?1:cards.length-1))%cards.length].focus();}}
 });
}
