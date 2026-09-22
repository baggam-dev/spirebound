import {shieldStatusMarkup} from './combat-status.js';
import {essences} from './essences.js';
import {iconSVG} from './pixel-icons.js';
import {skills,xpRequired} from './progression.js';
import {relicInfo,ownedRelics,relicStat,hexFactor,movementSpeed,attackInterval} from './relics.js';
import {incantationInfo} from './shrine.js';

export function displayedStats(p){return {attack:p.damage*(1+.12*(p.power||0)+relicStat(p,'damage'))*hexFactor(p,'damage')*(1+relicStat(p,'direct')),speed:movementSpeed(p),rate:1/attackInterval(p)};}
export function createDamageMeter(){let id=null,samples=[],lastTime=-1;return s=>{if(id!==s.runId||s.elapsed<lastTime){id=s.runId;samples=[];lastTime=-1;}if(s.elapsed!==lastTime){samples.push({time:s.elapsed,damage:s.metrics?.damageDealt||0});lastTime=s.elapsed;}while(samples.length>1&&samples[1].time<=s.elapsed-5)samples.shift();return Math.max(0,((s.metrics?.damageDealt||0)-(samples[0]?.damage||0))/5);};}
const tip=(title,description)=>`<span class="hud-tooltip"><strong>${title}</strong><span>${description}</span></span>`;
export function relicMarkup(p,key=false){const keyIcon=key?'<span class="hud-item relic-item exit-key" tabindex="0" aria-label="1층 탈출 열쇠: 1층 입구로 돌아가 탈출하세요.">'+iconSVG('exitKey')+tip('1층 탈출 열쇠','1층 입구로 돌아가 탈출하세요.')+'</span>':'';return keyIcon+( ownedRelics(p).map(id=>{const r=relicInfo(id);return `<span class="hud-item relic-item ${r.grade==='unique'?'unique-relic':''}" tabindex="0" aria-label="${r.name}: ${r.description}">${iconSVG(id)}${tip((r.grade==='unique'?'유니크 · ':'')+r.name,r.description)}</span>`;}).join('')||(key?'':'<span class="hud-empty">유물 없음</span>'));}
export function skillMarkup(p){return skills.filter(k=>p[k.id]>0).map(k=>`<span class="hud-item skill-item" tabindex="0" aria-label="${k.id==='ultimate'?(p.evolutions?.ultimate==='turret'?'자동 저격 석궁':'화살비'):k.name+' '+p[k.id]+'레벨'}">${iconSVG(k.id==='ultimate'&&p.evolutions?.ultimate==='turret'?'turret':k.id)}<b>${p[k.id]}</b>${tip(k.id==='ultimate'?(p.evolutions?.ultimate==='turret'?'자동 저격 석궁':'화살비'):k.name+' '+p[k.id]+'레벨',k.description)}</span>`).join('')||'<span class="hud-empty">첫 기술을 기다리는 중</span>';}
export function healthMarkup(p){const visible=Math.min(20,p.max);return Array.from({length:visible},(_,i)=>`<span class="pixel-heart ${i<p.hp?'':'empty'}">${iconSVG('heart')}</span>`).join('')+`<span class="heart-count">${p.hp}/${p.max}</span>`;}
export function essenceMarkup(p){return essences.filter(e=>(p.essenceCounts?.[e.id]||0)>0).map(e=>{const n=p.essenceCounts[e.id],effect=e.id==='ultimate'?'궁극기 쿨타임 '+((1-Math.pow(.9,n))*100).toFixed(1)+'% 감소':e.id==='attack'?'공격력 +'+n*3:e.id==='health'?'최대 체력 +'+n:(e.id==='speed'?'이동속도':'공격속도')+' +'+n*5+'%';return '<span class="hud-item essence-item" tabindex="0" aria-label="'+e.name+' '+n+'개: '+effect+'"><svg class="pixel-icon" viewBox="0 0 16 16" aria-hidden="true"><path fill="'+e.color+'" d="M7 1h2v2h2v3h2v5h-2v2H5v-2H3V6h2V3h2z"/><path fill="#fff9" d="M6 5h2v4H6z"/></svg><b>×'+n+'</b>'+tip(e.name+' '+n+'개',effect)+'</span>';}).join('');}
export function createHUD(){
 const el=id=>document.getElementById(id),meter=createDamageMeter();let relicKey='',skillKey='',healthKey='';
 return function updateHUD(s){el('runHUD').hidden=!s;if(!s)return;const p=s.player,rs=ownedRelics(p).join('|')+'|'+s.key,ss=skills.map(k=>p[k.id]||0).join('|')+'|'+(p.evolutions?.ultimate||''),hs=p.hp+'/'+p.max;
  if(rs!==relicKey||!el('relicStrip').innerHTML){el('relicStrip').innerHTML=relicMarkup(p,s.key);relicKey=rs;}
  if(ss!==skillKey||!el('skillStrip').innerHTML){el('skillStrip').innerHTML=skillMarkup(p);skillKey=ss;}
  if(hs!==healthKey){el('heartStrip').innerHTML=healthMarkup(p);healthKey=hs;el('heartStrip').setAttribute('aria-label',`체력 ${p.hp}/${p.max}`);}
  const essenceKey=JSON.stringify(p.essenceCounts||{});if(el('essenceStrip').dataset.counts!==essenceKey){el('essenceStrip').innerHTML=essenceMarkup(p);el('essenceStrip').dataset.counts=essenceKey;}
  el('shieldStatus').innerHTML=shieldStatusMarkup(s);
  const stats=displayedStats(p),dps=meter(s);el('statReadout').innerHTML=`<b>LV ${p.level}</b><span>공격력 ${stats.attack.toFixed(1)}</span><span>공속 ${stats.rate.toFixed(2)}/초</span><span>이속 ${stats.speed.toFixed(0)}</span><span title="최근 5초간 실제로 준 피해 ÷ 5. 범위 피해 포함. 조건부 유물 효과는 공격력 숫자에 미포함.">DPS ${dps.toFixed(1)}</span>`;
  const required=xpRequired(p.level);el('xpFill').style.width=Math.min(100,p.xp/required*100)+'%';el('xpTrack').setAttribute('aria-valuemax',required);el('xpTrack').setAttribute('aria-valuenow',p.xp);el('xpLabel').textContent=`LV ${p.level} · ${p.xp} / ${required}`;
  const aura=el('skillStrip').querySelector('[aria-label^="근접 오라"]');if(aura)aura.dataset.cooldown=p.aura>=3?(s.auraShield>0?Math.ceil(s.auraShield)+'s':'방어 준비'):'';
  el('hexStatus').textContent=(p.incantations||[]).map(id=>incantationInfo(id).name).join(' · ');el('hexStatus').title=(p.incantations||[]).map(id=>incantationInfo(id).description).join('\n');
 };
}
