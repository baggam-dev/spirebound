import {enemyGuide} from '../world/expedition.js';
import {renderJournalPortraits} from '../rendering/journal-portraits.js';
import {escapeHtml} from './ui.js';

const groups={일반:['chaser','charger','archer','scatter','brute','laser','ricochet','flower','minislime'],네임드:['kald','vera'],상층:['astralSniper','gravityMage','starKnight','starBearer','royalGuard','pulseTurret','riftHunter'],악마:['demonBat','spikeNest','demonSoldier','demonArcher','demonCaptain'],귀환:['strafer','ringcaster','ambusher'],보스:['warden','prism','slime','king','commander','demon']};
const advice={
 kald:'방패 정면을 피해 돌아가고, 돌진을 장애물로 유도한 뒤 빈틈을 노리세요.',vera:'이동 후 조준이 고정될 때 옆으로 빠지고 고리의 틈으로 이동하세요.',
 chaser:'준비 동작을 보면 뒤나 측면으로 이동하세요. 장애물로 베기를 막을 수 있습니다.',charger:'돌진 방향이 고정되면 옆으로 이동하세요.',archer:'조준이 고정된 뒤 같은 방향으로 계속 움직이세요.',scatter:'거리를 벌려 탄 사이의 공간을 확보하세요.',brute:'착지 예고 원을 벗어나고 공격 후 빈틈을 노리세요.',laser:'굵은 예고선에서 벗어나거나 장애물 뒤로 숨으세요.',ricochet:'벽에 닿은 탄이 등 뒤로 돌아오는 경로도 확인하세요.',flower:'착탄 예고를 피하고 독 장판 밖에서 공격하세요.',minislime:'분열체에 둘러싸이지 않도록 공간을 확보하세요. 소환체 처치는 성장 보상을 주지 않습니다.',
 astralSniper:'조준선이 고정되면 선을 가로질러 벗어나세요.',gravityMage:'보라 원이 활성화되기 전에 나오세요. 갇혔다면 구르기로 탈출하세요.',starKnight:'방패 뒤로 돌아가거나 장판·지속 피해를 활용하세요.',starBearer:'주변 적을 가속하므로 먼저 처치하세요.',royalGuard:'전방 베기 밖으로 빠지고 공격이 끝난 뒤 접근하세요.',pulseTurret:'고리 탄막의 넓은 틈을 찾아 통과하세요.',riftHunter:'출현 예고에서 벗어난 뒤 이어지는 전방 베기까지 피하세요.',
 demonBat:'돌진 예고를 보면 옆으로 피하고 자폭 지점과 거리를 두세요.',spikeNest:'발밑에 고정된 예고 지점을 벗어나세요.',demonSoldier:'준비 후 전방을 베므로 측면이나 뒤로 돌아가세요.',demonArcher:'고정 조준 후 두 갈래로 발사합니다. 조준 방향에서 벗어나세요.',demonCaptain:'예고 방향 옆으로 피한 뒤 돌진 후의 빈틈을 노리세요.',
 strafer:'측면 이동을 따라 조준하고 평행 탄막의 옆으로 벗어나세요.',ringcaster:'넓게 비어 있는 고리의 틈으로 통과하세요.',ambusher:'긴 준비 동안 돌진 방향을 확인하고 옆으로 피하세요. 제동 중 반격하세요.',
 warden:'탄막의 빈 공간을 확보하고 내려찍기 목표가 고정되면 이동하세요.',prism:'광선 예고를 피하면서 반사탄이 돌아오는 길을 확인하세요.',slime:'분열할 때 포위되지 않도록 공간을 확보하고 남은 분열체를 모두 처치하세요.',king:'단계가 바뀌면 공격이 달라집니다. 전조를 피하고 연속 공격이 끝난 빈틈을 노리세요.',commander:'저격선·화살비 착탄 예고를 피하고 점멸 후 위치를 다시 확인하세요.',demon:'부위를 차례로 파괴하세요. 본체 가까이에서는 양팔 휘두르기 예고 밖으로 피하세요.'
};
const parts=[['core','본체'],['hand','손'],['foot','발'],['eye','눈'],['nose','코'],['mouth','입']];
const portrait=(key,large=false,part='')=>`<canvas class="bestiary-portrait ${large?'bestiary-portrait-large':''}" width="${large?320:160}" height="${large?320:160}" data-enemy="${key}" ${part?`data-part="${part}"`:''} role="img" aria-label="${escapeHtml(enemyGuide[key].name+(part?' '+parts.find(p=>p[0]===part)?.[1]:''))} 모습"></canvas>`;

export function bestiaryMarkup(){return `<section class="bestiary"><div class="bestiary-header"><div><small>FIELD BESTIARY</small><h2>몬스터 도감</h2><p>탑의 적을 살펴보고 공격에 대비하세요.</p></div><button id="closeBestiary">돌아가기</button></div><nav class="bestiary-filters" aria-label="몬스터 분류">${['전체',...Object.keys(groups)].map((g,i)=>`<button data-category="${g}" aria-pressed="${i===0}">${g}${i===0?' '+Object.keys(enemyGuide).length:''}</button>`).join('')}</nav><div class="bestiary-layout"><section class="bestiary-list"><label for="bestiarySearch">이름으로 찾기</label><input id="bestiarySearch" type="search" placeholder="몬스터 이름" autocomplete="off"><p id="bestiaryCount" aria-live="polite"></p><div id="bestiaryCards" class="bestiary-cards" aria-label="몬스터 목록"></div></section><section id="bestiaryDetail" class="bestiary-detail" aria-label="몬스터 상세"></section></div><p class="bestiary-note">${Object.keys(enemyGuide).length}종의 외형과 설명을 자유롭게 볼 수 있습니다.</p></section>`;}

export function mountBestiary(root,onClose){
 let category='전체',query='',selected='chaser',part='core';
 const cards=root.querySelector('#bestiaryCards'),detail=root.querySelector('#bestiaryDetail'),search=root.querySelector('#bestiarySearch');
 function showDetail(){
  const entry=enemyGuide[selected],group=Object.keys(groups).find(g=>groups[g].includes(selected));
  detail.innerHTML=`<h3>${escapeHtml(entry.name)}</h3><p class="bestiary-category">${group}</p><div class="bestiary-stage">${portrait(selected,true,selected==='demon'?part:'')}</div>${selected==='demon'?`<div class="bestiary-parts" aria-label="대악마 부위">${parts.map(([id,name])=>`<button data-demon-part="${id}" aria-pressed="${id===part}">${name}</button>`).join('')}</div>`:''}<article><h4>공격 특징</h4><p>${escapeHtml(entry.tip)}</p></article><article><h4>대응법</h4><p>${escapeHtml(advice[selected])}</p></article>`;
  renderJournalPortraits(root);
 }
 function showList(){
  const keys=Object.keys(enemyGuide).filter(k=>(category==='전체'||groups[category].includes(k))&&enemyGuide[k].name.replace(/\s/g,'').includes(query.replace(/\s/g,'')));
  if(keys.length&&!keys.includes(selected)){selected=keys[0];part='core';}
  cards.innerHTML=keys.length?keys.map(k=>`<button class="bestiary-card" data-monster="${k}" aria-pressed="${k===selected}">${portrait(k)}<span>${escapeHtml(enemyGuide[k].name)}</span></button>`).join(''):'<p>검색 결과가 없습니다.</p><button data-clear-search>검색 초기화</button>';
  root.querySelector('#bestiaryCount').textContent=`${keys.length}종 표시 / 전체 ${Object.keys(enemyGuide).length}종`;
  if(keys.length)showDetail();else detail.innerHTML='<p>다른 이름이나 분류로 찾아보세요.</p>';
 }
 search.addEventListener('input',()=>{query=search.value;showList();});
 root.addEventListener('click',event=>{
  const target=event.target.closest('button');if(!target||!root.contains(target))return;
  if(target.id==='closeBestiary'){onClose();return;}
  if(target.dataset.category){category=target.dataset.category;root.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b===target)));showList();}
  if(target.dataset.monster){selected=target.dataset.monster;part='core';cards.querySelectorAll('[data-monster]').forEach(b=>b.setAttribute('aria-pressed',String(b===target)));showDetail();}
  if(target.dataset.demonPart){part=target.dataset.demonPart;showDetail();detail.querySelector(`[data-demon-part="${part}"]`)?.focus();}
  if(target.hasAttribute('data-clear-search')){query='';category='전체';search.value='';root.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category==='전체')));showList();search.focus();}
 });
 showList();
}
