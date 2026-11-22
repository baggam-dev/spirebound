import {skills} from '../progression/progression.js';
import {mainSkills} from '../progression/skill-tree.js';
import {evolutions} from '../progression/evolutions.js';
import {utilitySkills} from '../combat/utility.js';
import {utilityGuide} from './utility-guide.js';
import {ownedRelics,relicInfo,relicGradeName,ultimateCooldown} from '../progression/relics.js';
import {essences} from '../progression/essences.js';
import {relicStateText} from './relic-ui.js';
import {shieldCooldown} from '../combat/survival.js';
import {displayedStats,currentDamageRate} from './hud.js';
import {incantationInfo} from '../world/shrine.js';
import {skillIconMarkup} from '../rendering/skill-icons.js';
import {relicIconMarkup} from '../rendering/relic-icons.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tabs={skills:'스킬',relics:'유물',essences:'정수'};
export const createBuildView=()=>({tab:'skills',selected:{},scroll:{}});
const seconds=n=>Number(n.toFixed(2))+'초';
export function buildEntries(s,tab){
 const p=s.player;
 if(tab==='relics')return ownedRelics(p).filter(id=>relicInfo(id)).map(id=>({id,name:relicInfo(id).name,icon:relicIconMarkup(id),tag:relicGradeName(id),description:relicInfo(id).description,note:id==='windSeal'?'회복 진행 '+(p.leechKills||0)+' / 20 처치':relicStateText(s,id)}));
 if(tab==='essences')return essences.map(e=>{
  const n=p.essenceCounts?.[e.id]||0,effect=e.id==='attack'?'공격력 +'+n*3:e.id==='health'?'최대 체력 +'+n:e.id==='ultimate'?'궁극기 쿨타임 '+((1-Math.pow(.9,n))*100).toFixed(1)+'% 감소':(e.id==='speed'?'이동속도':'공격속도')+' +'+n*5+'%';
  return {id:e.id,name:e.name,icon:'<span class="build-crystal" style="color:'+e.color+'" aria-hidden="true">◆</span>',tag:'누적 '+n+'개',description:effect,note:'획득 즉시 적용됨 · 이번 원정의 정수 기여입니다. 다른 성장 효과를 포함한 최종 능력치와는 다릅니다.'};
 });
 const entries=skills.filter(k=>p[k.id]>0).map(k=>{
  const evolution=evolutions[k.id]?.find(e=>e.id===p.evolutions?.[k.id]),ultimate=k.id==='ultimate';
  return {id:k.id,name:ultimate?(evolution?.name||'궁극기'):k.name,icon:skillIconMarkup(ultimate?'ultimate:'+p.evolutions?.ultimate:k.id),tag:ultimate?'궁극기':(mainSkills.includes(k.id)?'평타 계열':'일반 스킬')+' · LV '+p[k.id],description:ultimate?(evolution?.description||k.description):k.description+(evolution?' · '+evolution.description:''),note:(evolution?'진화 · '+evolution.name:'')+(ultimate?' · 현재 재사용 '+seconds(ultimateCooldown(p)):'')};
 });
 const active=utilitySkills.find(k=>k.id===p.utility);
 if(active){const guide=utilityGuide(s,{paused:true});entries.push({id:'active:'+active.id,name:active.name,icon:skillIconMarkup(active.id),tag:'액티브',description:guide.description,note:'G 키 / 액티브 버튼 · '+guide.status+' · '+guide.tip});}
 return entries;
}
function statsMarkup(s){
 const p=s.player,stats=displayedStats(p),notes=[];
 if(p.chargeCell>0)notes.push(p.chargeReady?'축전 · 방전 준비':'축전 '+(p.chargeHits||0)+' / '+(p.chargeCell>=3?3:4));
 if(p.royalJudgment>0)notes.push((s.critical?.royalCharges||0)>=8?'왕의 선고 · 선고 준비':'왕의 선고 '+(s.critical?.royalCharges||0)+' / 8');
 if(p.critFocusTime>0||p.critFocusCooldown>0)notes.push('회피의 집중 '+(p.critFocusTime>0?'유지 '+seconds(p.critFocusTime):'재사용 '+seconds(p.critFocusCooldown)));
 if(p.aura>0)notes.push('망령검 · '+(s.bladeCooldown>0?seconds(s.bladeCooldown):'요격 준비'));
 return '<details class="build-stats"><summary>능력치 · 주술 · 준비 상태</summary><p>공격력 '+stats.attack.toFixed(1)+' · 공속 '+stats.rate.toFixed(2)+'/초 · 이속 '+stats.speed.toFixed(0)+'<br>치명 '+(stats.criticalChance*100).toFixed(0)+'% · 피해 '+(stats.criticalMultiplier*100).toFixed(0)+'%<br>최근 5초 DPS '+currentDamageRate().toFixed(1)+' (범위 피해 포함)</p><p>조건부 유물 효과는 공격력 숫자에 포함되지 않습니다.</p>'+notes.map(n=>'<p>'+esc(n)+'</p>').join('')+(p.incantations||[]).map(id=>{const hex=incantationInfo(id);return '<p>'+esc(hex.name)+' · '+esc(hex.description)+'</p>';}).join('')+'</details>';
}
function content(s,view){
 const tab=Object.hasOwn(tabs,view.tab)?view.tab:'skills',entries=buildEntries(s,tab),selected=entries.find(e=>e.id===view.selected[tab])||entries[0];
 const canEat=!(s.floors[s.floor][s.room].enemies.length||!s.player.food||s.pendingHeal||s.player.hp>=s.player.max);
 const food=s.pendingHeal?'음식 회복 예약됨 · 재개할 때 1하트 회복':!s.player.food?'보유 음식 없음':s.player.hp>=s.player.max?'체력이 가득 찼습니다':s.floors[s.floor][s.room].enemies.length?'적이 없는 안전한 방에서 사용':'음식 '+s.player.food+'개 · 1하트 회복';
 return '<header class="build-heading"><div><small>일시정지 중 · '+esc(s.player.weapon?'강화 장궁':'정찰병의 활')+' · 공격력 '+esc(s.player.damage)+' · '+esc(s.player.armor?'보호막 재충전 '+seconds(shieldCooldown(s.player)):'보호막 없음')+'</small><h2 id="buildTitle">이번 원정 · 빌드</h2></div><button id="buildClose" aria-label="빌드 닫고 탐험 재개">×</button></header><nav role="tablist" aria-label="빌드 분류">'+Object.entries(tabs).map(([id,name])=>'<button id="buildTab-'+id+'" role="tab" data-build-tab="'+id+'" aria-selected="'+(id===tab)+'" aria-controls="buildPane" tabindex="'+(id===tab?'0':'-1')+'">'+name+'</button>').join('')+'</nav><div id="buildPane" role="tabpanel" aria-labelledby="buildTab-'+tab+'" class="build-body"><div class="build-list" aria-label="'+tabs[tab]+' 목록">'+(entries.map(e=>'<button data-build-entry="'+esc(e.id)+'" aria-pressed="'+(e===selected)+'">'+e.icon+'<strong>'+esc(e.name)+'</strong><small>'+esc(e.tag)+'</small></button>').join('')||'<p class="build-empty">'+(tab==='relics'?'보유 유물이 없습니다.':'아직 획득한 스킬이 없습니다.')+'</p>')+'</div><section class="build-detail" aria-label="선택 항목 상세">'+(selected?selected.icon+'<h3>'+esc(selected.name)+'</h3><small>'+esc(selected.tag)+'</small><p>'+esc(selected.description)+'</p><p>'+esc(selected.note)+'</p>':'<h3>'+tabs[tab]+'</h3><p>탐험 중 획득한 항목이 여기에 표시됩니다.</p>')+(tab==='skills'&&!s.player.utility?'<p class="build-hint">액티브 · 레벨5와 보스1회 처치 후 룰렛으로 획득</p>':'')+(tab==='skills'&&!s.player.ultimate?'<p class="build-hint">궁극기 · 레벨8과 보스2회 처치 후 해금</p>':'')+(tab==='relics'&&s.key?'<p>탈출 열쇠 보유 · 1층 입구로 귀환하세요.</p>':'')+statsMarkup(s)+'</section></div><p class="build-food-note" role="status">'+esc('물약 '+(s.player.potions||0)+'개 · 음식 '+(s.player.food||0)+'개 · '+food)+'</p><footer class="build-footer"><button id="eat" '+(canEat?'':'disabled')+'>음식 사용</button><button id="journal">원정 기록</button><button id="buildBestiary">도감</button><button id="closeBag" class="primary">탐험 재개</button></footer>';
}
export const buildWindowMarkup=(s,view)=>'<section class="build-window">'+content(s,view)+'</section>';
export function mountBuildWindow(root,s,view,actions={}){
 const remember=()=>{view.scroll[view.tab]=[root.querySelector('.build-list').scrollTop,root.querySelector('.build-detail').scrollTop];};
 function render(focus){root.innerHTML=content(s,view);const positions=view.scroll[view.tab]||[0,0];root.querySelector('.build-list').scrollTop=positions[0];root.querySelector('.build-detail').scrollTop=positions[1];if(focus)root.querySelector(focus)?.focus();}
 root.addEventListener('click',e=>{const action=e.target.closest('button')?.id;if(actions[action]){remember();actions[action]();return;}const tab=e.target.closest('[data-build-tab]'),item=e.target.closest('[data-build-entry]');if(tab){remember();view.tab=tab.dataset.buildTab;render('[aria-selected="true"]');}else if(item){remember();view.selected[view.tab]=item.dataset.buildEntry;render('[aria-pressed="true"]');}});
 root.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='i'&&!e.repeat){e.preventDefault();e.stopPropagation();actions.closeBag?.();return;}const tab=e.target.closest('[data-build-tab]');if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();e.stopPropagation();remember();const ids=Object.keys(tabs),i=ids.indexOf(view.tab);view.tab=ids[e.key==='Home'?0:e.key==='End'?ids.length-1:(i+(e.key==='ArrowRight'?1:-1)+ids.length)%ids.length];render('[aria-selected="true"]');});
 const positions=view.scroll[view.tab]||[0,0];root.querySelector('.build-list').scrollTop=positions[0];root.querySelector('.build-detail').scrollTop=positions[1];
 return {remember};
}
