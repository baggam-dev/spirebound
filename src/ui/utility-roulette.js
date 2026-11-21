import {utilitySkills} from '../combat/utility.js';
import {utilityCooldown} from '../progression/relics.js';
import {skillIconMarkup} from '../rendering/skill-icons.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function utilityRouletteMarkup(s,{reduced=false}={}){
 const q=s.utilityDraft,revealed=q.status==='revealed',winner=utilitySkills.find(k=>k.id===q.winner);
 return '<section class="utility-roulette '+(reduced?'reduced':'')+'"><small>ACTIVE · LEVEL 5</small><h2>운명의 액티브</h2><p>후보 3개 중 1개를 무작위로 획득합니다. 각 후보의 당첨 확률은 같습니다.</p><div class="utility-cards">'+q.offers.map((id,i)=>{
  const k=utilitySkills.find(k=>k.id===id),selected=revealed&&id===q.winner;
  return '<article data-utility-card="'+i+'" class="utility-candidate '+(selected?'is-winner':'')+'">'+skillIconMarkup(id)+'<h3>'+esc(k.name)+'</h3><p>'+esc(k.description.replace(/재사용 \d+초/,'재사용 '+Number(utilityCooldown(s.player,id).toFixed(2))+'초'))+'</p><small>'+(selected?'당첨':'후보 '+(i+1))+'</small></article>';
 }).join('')+'</div><p id="utilityDrawStatus" role="status" aria-live="polite">'+(revealed?'당첨 · '+esc(winner.name):'세 후보의 효과를 확인한 뒤 추첨을 시작하세요.')+'</p>'+(revealed?'<button id="utilityDrawClaim" class="primary">획득하고 계속</button>':'<button id="utilityDrawStart" class="primary">추첨 시작</button><button id="utilityDrawSkip" hidden>연출 건너뛰기 ▸</button>')+'<p class="utility-note">G 키 또는 오른쪽 액티브 버튼으로 사용 · 카드와 정지 타이밍은 결과에 영향을 주지 않습니다.</p></section>';
}
export function createUtilityRoulette(host,{draft,reduced=false,onFinish}){
 let elapsed=0,spinning=false,finished=false;
 const duration=reduced?.45:2.4,winner=draft.offers.indexOf(draft.winner),cards=[...host.querySelectorAll('[data-utility-card]')];
 const finish=()=>{if(finished||!spinning||elapsed<.15||!host.isConnected)return false;finished=true;spinning=false;onFinish();return true;};
 return {
  get spinning(){return spinning;},
  start(){if(spinning||finished||!host.isConnected)return false;spinning=true;host.querySelector('#utilityDrawStart').disabled=true;host.querySelector('#utilityDrawSkip').hidden=false;host.querySelector('#utilityDrawStatus').textContent='추첨 중…';return true;},
  tick(dt){
   if(!spinning||!host.isConnected)return;
   if(Number.isFinite(dt)&&dt>0)elapsed=Math.min(duration,elapsed+Math.min(dt,.1));
   const p=elapsed/duration,index=reduced?winner:Math.floor((15+winner)*(1-(1-p)**3))%3;
   cards.forEach((card,i)=>card.classList.toggle('is-highlighted',i===index));
   host.querySelector('#utilityDrawSkip').disabled=elapsed<.15;
   if(elapsed>=duration)finish();
  },
  skip:finish
 };
}
