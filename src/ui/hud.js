import {relicIconMarkup} from '../rendering/relic-icons.js';
import {relicGrade,relicGradeName} from '../progression/relics.js';
import {skillIconMarkup} from '../rendering/skill-icons.js';
import {shieldStatusMarkup} from '../combat/combat-status.js';
import {essences} from '../progression/essences.js';
import {iconSVG} from '../rendering/pixel-icons.js';
import {skills,xpRequired} from '../progression/progression.js';
import {relicInfo,ownedRelics,relicStat,hexFactor,movementSpeed,attackInterval} from '../progression/relics.js';
import {incantationInfo} from '../world/shrine.js';

export function displayedStats(p){return {attack:p.damage*(1+.12*(p.power||0)+relicStat(p,'damage'))*hexFactor(p,'damage')*(1+relicStat(p,'direct')),speed:movementSpeed(p),rate:1/attackInterval(p)};}
export function createDamageMeter(){let id=null,samples=[],lastTime=-1;return s=>{if(id!==s.runId||s.elapsed<lastTime){id=s.runId;samples=[];lastTime=-1;}if(s.elapsed!==lastTime){samples.push({time:s.elapsed,damage:s.metrics?.damageDealt||0});lastTime=s.elapsed;}while(samples.length>1&&samples[1].time<=s.elapsed-5)samples.shift();return Math.max(0,((s.metrics?.damageDealt||0)-(samples[0]?.damage||0))/5);};}
const tip=(title,description)=>`<span class="hud-tooltip"><strong>${title}</strong><span>${description}</span></span>`;
export function relicMarkup(p,key=false,capacity=24,spent=false){
 const keyIcon=key?'<button type="button" class="hud-item relic-item exit-key" data-relic-detail="all" aria-label="1층 탈출 열쇠">'+iconSVG('exitKey')+tip('1층 탈출 열쇠','1층 입구로 돌아가 탈출하세요.')+'</button>':'';
 const ids=ownedRelics(p),available=capacity-(key?1:0),visible=ids.length>available?available-1:available;
 const items=ids.slice(0,visible).map(id=>{const r=relicInfo(id),used=id==='phoenixReliquary'&&spent,note=used?' · 소모됨':'',title=relicGradeName(id)+' · '+r.name+note;return '<button type="button" class="hud-item relic-item '+relicGrade(id)+(used?' spent':'')+'" data-relic-detail="'+id+'" aria-label="'+title+': '+r.description+'">'+relicIconMarkup(id)+tip(title,r.description)+'</button>';}).join('');
 const hidden=ids.length-visible,more=hidden>0?'<button type="button" class="hud-item relic-more" data-relic-detail="all" aria-label="보유 유물 전체 보기 · 접힌 유물 '+hidden+'개">+'+hidden+'</button>':'';
 return keyIcon+items+more||'<span class="hud-empty">유물 없음</span>';
}
export function skillMarkup(p){return skills.filter(k=>p[k.id]>0).map(k=>`<span class="hud-item skill-item" tabindex="0" aria-label="${k.id==='ultimate'?(p.evolutions?.ultimate==='turret'?'자동 저격 석궁':'화살비'):k.name+' '+p[k.id]+'레벨'}">${skillIconMarkup(k.id==='ultimate'?'ultimate:'+p.evolutions?.ultimate:k.id)}<b>${p[k.id]}</b>${tip(k.id==='ultimate'?(p.evolutions?.ultimate==='turret'?'자동 저격 석궁':'화살비'):k.name+' '+p[k.id]+'레벨',k.description)}</span>`).join('')||'<span class="hud-empty">첫 기술을 기다리는 중</span>';}
export function healthMarkup(p){const visible=Math.min(20,p.max);return Array.from({length:visible},(_,i)=>`<span class="pixel-heart ${i<p.hp?'':'empty'}">${iconSVG('heart')}</span>`).join('')+`<span class="heart-count">${p.hp}/${p.max}</span>`;}
export function essenceMarkup(p){return essences.filter(e=>(p.essenceCounts?.[e.id]||0)>0).map(e=>{const n=p.essenceCounts[e.id],effect=e.id==='ultimate'?'궁극기 쿨타임 '+((1-Math.pow(.9,n))*100).toFixed(1)+'% 감소':e.id==='attack'?'공격력 +'+n*3:e.id==='health'?'최대 체력 +'+n:(e.id==='speed'?'이동속도':'공격속도')+' +'+n*5+'%';return '<span class="hud-item essence-item" tabindex="0" aria-label="'+e.name+' '+n+'개: '+effect+'"><svg class="pixel-icon" viewBox="0 0 16 16" aria-hidden="true"><path fill="'+e.color+'" d="M7 1h2v2h2v3h2v5h-2v2H5v-2H3V6h2V3h2z"/><path fill="#fff9" d="M6 5h2v4H6z"/></svg><b>×'+n+'</b>'+tip(e.name+' '+n+'개',effect)+'</span>';}).join('');}
export function createHUD(){
 const el=id=>document.getElementById(id),meter=createDamageMeter();let relicKey='',skillKey='',healthKey='';
 return function updateHUD(s){el('runHUD').hidden=!s;if(!s)return;const coarse=!!globalThis.matchMedia?.('(pointer:coarse)').matches,columns=coarse?Math.max(1,Math.min(4,Math.floor((el('mobileLeftRail')?.clientWidth||72)/26))):Math.max(2,Math.min(12,Math.floor(((el('runHUD').clientWidth||960)-200)/31))),capacity=Math.max(2,columns*2);el('relicStrip').style.setProperty('--relic-columns',String(columns));const p=s.player,rs=ownedRelics(p).join('|')+'|'+s.key+'|'+!!s.phoenixSpent+'|'+capacity,ss=skills.map(k=>p[k.id]||0).join('|')+'|'+(p.evolutions?.ultimate||''),hs=p.hp+'/'+p.max;
  if(rs!==relicKey||!el('relicStrip').innerHTML){el('relicStrip').innerHTML=relicMarkup(p,s.key,capacity,!!s.phoenixSpent);relicKey=rs;}
  if(ss!==skillKey||!el('skillStrip').innerHTML){el('skillStrip').innerHTML=skillMarkup(p);skillKey=ss;}
  if(hs!==healthKey){el('heartStrip').innerHTML=healthMarkup(p);healthKey=hs;el('heartStrip').setAttribute('aria-label',`체력 ${p.hp}/${p.max}`);}
  const essenceKey=JSON.stringify(p.essenceCounts||{});if(el('essenceStrip').dataset.counts!==essenceKey){el('essenceStrip').innerHTML=essenceMarkup(p);el('essenceStrip').dataset.counts=essenceKey;}
  el('shieldStatus').innerHTML=shieldStatusMarkup(s);
  const stats=displayedStats(p),dps=meter(s);el('statReadout').innerHTML=`<b>LV ${p.level}</b><span>공격력 ${stats.attack.toFixed(1)}</span><span>공속 ${stats.rate.toFixed(2)}/초</span><span>이속 ${stats.speed.toFixed(0)}</span><span title="최근 5초간 실제로 준 피해 ÷ 5. 범위 피해 포함. 조건부 유물 효과는 공격력 숫자에 미포함.">DPS ${dps.toFixed(1)}</span>`;
  const required=xpRequired(p.level);el('xpFill').style.width=Math.min(100,p.xp/required*100)+'%';el('xpTrack').setAttribute('aria-valuemax',required);el('xpTrack').setAttribute('aria-valuenow',p.xp);el('xpLabel').textContent=`LV ${p.level} · ${p.xp} / ${required}`;
  const charge=el('skillStrip').querySelector('[aria-label^="축전"]');if(charge)charge.dataset.cooldown=p.chargeReady?'방전 준비':(p.chargeHits||0)+'/'+(p.chargeCell>=3?3:4);
  const aura=el('skillStrip').querySelector('[aria-label^="망령검: 베르가스"]');if(aura)aura.dataset.cooldown=s.bladeCooldown>0?s.bladeCooldown.toFixed(1)+'s':'요격 준비';
  el('hexStatus').textContent=(p.incantations||[]).map(id=>incantationInfo(id).name).join(' · ');el('hexStatus').title=(p.incantations||[]).map(id=>incantationInfo(id).description).join('\n');
 };
}
