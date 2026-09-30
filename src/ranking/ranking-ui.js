import {escapeHtml} from '../ui/ui.js';
import {rankingError} from './ranking-client.js';
import {RANKING_SEASON,EXPANDED_SEASON,CLASSIC_ARCHIVES,EXPANDED_ARCHIVES,rankingSeason} from './ranking.js';
const builds={fire:'화염',frost:'서리',poison:'독',chain:'번개'};
const number=n=>Number.isFinite(n)?Math.floor(n).toLocaleString('ko-KR'):'—';
const duration=ms=>{const seconds=Math.floor(ms/1000);return Number.isFinite(seconds)?Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0'):'—';};
export function rankRow(row,mine=false){return `<li class="rank-row${mine?' rank-mine':''}"><b>${number(row.rank)}</b><span>${escapeHtml(row.nickname)}<small>${duration(row.elapsedMs)} · ${builds[row.mainSkill]||'기타'}</small></span><strong>${number(row.score)}<small>점</small></strong></li>`;}
export function createRankingUI({client,panel,stop}){
 const byId=id=>document.getElementById(id);
 function submission(item,back){
  stop('rank');panel(`<div class="rank-view"><small>LEAVE YOUR NAME</small><h2>탈출 기록 등록</h2><p>${number(item.score)}점 · ${duration(item.payload.elapsedMs)}</p><p>등록하면 이름·점수·시간·주력 기술이 공개됩니다.</p><form id="rankForm"><label for="rankName">이름 · 한글/영문/숫자/밑줄 2~12자</label><input id="rankName" name="nickname" autocomplete="nickname" maxlength="12" required value="${escapeHtml(item.nickname||'')}" aria-describedby="rankMessage"><button class="primary" id="rankSubmit" type="submit">기록 등록</button></form><p id="rankMessage" role="status" aria-live="polite"></p><button id="rankBack">나중에 · 돌아가기</button><button id="rankViewBoard">RANK 보기</button></div>`);
  const form=byId('rankForm'),message=byId('rankMessage'),input=byId('rankName'),submit=byId('rankSubmit');
  const receipt=()=>{form.hidden=true;message.textContent=item.receipt.status==='held'?'기록이 접수되었습니다. 확인이 필요한 기록으로, 현재 순위에는 표시되지 않습니다.':`등록 완료 · ${item.receipt.nickname} · ${number(item.receipt.score.total)}점`;byId('rankBack').textContent='돌아가기';};
  byId('rankBack').onclick=back;byId('rankViewBoard').onclick=()=>board(()=>submission(item,back));
  if(item.receipt){receipt();return;}
  if(item.payload.seasonId!==rankingSeason(item.payload.seasonId.startsWith('ASCENT')?'expanded':'classic')){form.hidden=true;message.textContent='이전 시즌이 종료되어 새 기록은 등록할 수 없습니다. 저장된 기록은 이 브라우저에 남습니다.';return;}
  message.textContent=client.storageOK?'건너뛰어도 메인 RANK에서 나중에 등록할 수 있습니다.':'브라우저에 등록 대기 기록을 저장하지 못했습니다. 이 창을 닫기 전에 등록하세요.';
  form.onsubmit=async event=>{event.preventDefault();submit.disabled=true;input.disabled=true;message.textContent='등록 중…';try{await client.submit(item,input.value);if(message.isConnected)receipt();}catch(error){if(message.isConnected)message.textContent=rankingError(error)+(client.storageOK?' 입력한 이름은 보관되었습니다.':' 이 창을 닫으면 대기 기록을 잃을 수 있습니다.');}finally{if(form.isConnected){submit.disabled=false;input.disabled=false;}}};
 }
 async function board(back,season=RANKING_SEASON){
  stop('rank');const drafts=client.list(),seasons=[{seasonId:RANKING_SEASON,label:`8층 · ${RANKING_SEASON}`},{seasonId:EXPANDED_SEASON,label:`10층 · ${EXPANDED_SEASON}`},...CLASSIC_ARCHIVES.map(a=>({seasonId:a.seasonId,label:`8층 · ${a.seasonId} 기록`})),...EXPANDED_ARCHIVES.slice().reverse().map(a=>({seasonId:a.seasonId,label:`10층 · ${a.seasonId} 기록`}))];panel(`<div class="rank-view"><small>THE RETURNED</small><h2>RANK</h2><p>시즌별 최고 기록 · 상위 100명</p><div class="rank-seasons">${seasons.map(a=>`<button data-season="${a.seasonId}" aria-pressed="${season===a.seasonId}">${a.label}</button>`).join('')}</div><div id="rankBoard" aria-live="polite"><p>순위를 불러오는 중…</p></div>${drafts.length?'<details class="rank-pending"'+(drafts.some(r=>!r.receipt)?' open':'')+'><summary>내 등록 기록 · '+drafts.length+'개</summary>'+drafts.map((r,i)=>`<button class="rank-draft" data-draft="${i}">${escapeHtml(r.payload.seasonId||RANKING_SEASON)} · ${r.receipt?(r.receipt.status==='held'?'확인 대기':'등록 완료'):'등록 대기'} · ${number(r.score)}점 · ${duration(r.payload.elapsedMs)}</button>`).join('')+'</details>':''}<p class="rank-note">동점은 빠른 클리어 순입니다. 내 순위는 이 브라우저 기준이며, 쿠키를 지우면 연결이 사라집니다.</p><button id="rankRefresh">새로고침</button><button id="rankBack">돌아가기</button></div>`);
  const target=byId('rankBoard');byId('rankBack').onclick=back;byId('rankRefresh').onclick=()=>board(back,season);document.querySelectorAll('[data-season]').forEach(button=>button.onclick=()=>board(back,button.dataset.season));document.querySelectorAll('[data-draft]').forEach(button=>button.onclick=()=>submission(drafts[Number(button.dataset.draft)],()=>board(back,season)));
  try{const data=await client.leaderboard(season);if(!Array.isArray(data.entries)||data.entries.length>100||data.seasonId!==season)throw Error('Invalid leaderboard');if(!target.isConnected)return;target.innerHTML=`<p>${escapeHtml(data.seasonId)} · ${data.open?'진행 중':'종료'}</p><div class="rank-personal"><b>내 최고 기록</b>${data.mine?'<ol class="rank-list">'+rankRow(data.mine,true)+'</ol>':'<p>아직 등록된 순위가 없습니다.</p>'}</div>${data.entries.length?'<ol class="rank-list" aria-label="상위 순위">'+data.entries.map(r=>rankRow(r,r.recordId===data.mine?.recordId)).join('')+'</ol>':'<p>첫 번째 탈출 기록의 주인공이 되어 보세요.</p>'}`;}
  catch(error){if(target.isConnected){target.textContent=rankingError(error);target.setAttribute('role','alert');}}
 }
 return {board,submission};
}
