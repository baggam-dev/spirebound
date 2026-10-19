import {ownedRelics,relicInfo,relicGrade,relicGradeName} from '../progression/relics.js';
import {relicIconMarkup} from '../rendering/relic-icons.js';
import {relicPreviewMarkup} from './relic-preview.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const relicStateText=(s,id)=>id==='phoenixReliquary'?(s.phoenixSpent?'소모됨 · 이번 원정에서 이미 부활했습니다.':'부활 준비 · 원정당 1회') : '';
export function ownedRelicMarkup(s){const ids=ownedRelics(s.player);return '<div class="owned-relics">'+(ids.map(id=>'<article class="relic-owned '+relicGrade(id)+'">'+relicIconMarkup(id)+'<div><b>'+esc(relicInfo(id).name)+'</b><small>'+relicGradeName(id)+'</small><p>'+esc(relicInfo(id).description)+'</p><em>'+relicStateText(s,id)+'</em></div></article>').join('')||'<p>보유 유물이 없습니다.</p>')+'</div>';}
export function relicSelectionMarkup(s,r){const ids=ownedRelics(s.player);return '<section class="relic-draft"><header><small>RELIC COLLECTION</small><h2>수호자의 유물함</h2><p>하나를 선택하세요 · 획득한 유물은 누적 적용</p><details><summary>보유 유물 '+ids.length+'</summary>'+ownedRelicMarkup(s)+'</details></header><div class="relic-cards">'+(r.relicOffers||[]).map((id,i)=>'<button id="relic'+i+'" class="relic-card '+relicGrade(id)+'"><small class="relic-order" aria-hidden="true">'+(i+1)+'</small>'+relicIconMarkup(id)+'<small class="relic-grade">'+relicGradeName(id)+'</small><b>'+esc(relicInfo(id).name)+'</b><span>'+esc(relicInfo(id).description)+'</span>'+relicPreviewMarkup(s.player,id)+'<em>'+relicStateText(s,id)+'</em></button>').join('')+(!r.relicOffers?.length?'<p>새로 획득할 수 있는 유물이 없습니다.</p>':'')+'</div><footer><button id="skipRelic">유물함 지나가기</button><small>이번 유물함 보상을 받지 않고 진행합니다.</small></footer></section>';}
// Transient UI only: no saved unlock/collection state or extra confirmation step.
export function createRelicBanner(node){let active=null;return {
 show(s,room,id){active={run:s,room,id,start:s.elapsed};node.innerHTML=relicIconMarkup(id)+'<span><b>유물 획득 · '+esc(relicInfo(id).name)+'</b><small>'+esc(relicInfo(id).description)+'</small></span>';},
 clear(){active=null;node.hidden=true;},
 update(s,room,paused,reduced){node.classList.toggle('reduced',reduced);const age=active?s?.elapsed-active.start:Infinity;node.hidden=!active||active.run!==s||active.room!==room||age<0||age>=1.4||paused;if(active&&(active.run!==s||active.room!==room||age>=1.4))active=null;}
 };}
