import {skillIconMarkup} from '../rendering/skill-icons.js';
import {iconSVG} from '../rendering/pixel-icons.js';
import {rollAction} from '../combat/roll.js';
const coarse=window.matchMedia('(pointer:coarse)'),hud=document.getElementById('runHUD');
const left=document.createElement('div');left.id='mobileLeftRail';
const right=document.createElement('div');right.id='mobileRightRail';
const map=document.createElement('canvas');map.id='mobileMinimap';map.width=166;map.height=160;map.setAttribute('role','img');map.setAttribute('aria-label','탐색 지도 · 방 연결과 현재 위치');
right.append(map);hud.append(left,right);
const slots=[['.vitals',left],['#collectionHUD',left],['.build-status',left],['#statReadout',right]].map(([selector,target])=>{
 const node=document.querySelector(selector),marker=document.createComment('desktop HUD position');node.before(marker);return {node,marker,target};
});
hud.append(document.getElementById('relicStrip'));
function arrange(){for(const {node,marker,target} of slots){if(coarse.matches)target.append(node);else marker.after(node);}}
coarse.addEventListener('change',arrange);arrange();
export function renderHUDMinimap(draw,ctx,...args){
 if(!coarse.matches){draw(ctx,...args);return;}
 const c=map.getContext('2d');c.clearRect(0,0,166,160);c.save();c.translate(-772,-12);draw(c,...args);c.restore();
}
export function updateMobileActions(s){
 if(!coarse.matches||!s)return;
 const p=s.player,turret=p.evolutions?.ultimate==='turret',roll=rollAction(p);
 const actions=[['potion','potion','물약',s.potionCooldown,p.potions],['utility',p.utility||'focus',({focus:'마혈 각성',firstAid:'혈월 계약',guardian:'성역 구체'})[p.utility]||'유틸',s.utilityCooldown],['skill',turret?'turret':'ultimate',turret?'석궁':'화살비',s.skill],['dodge',roll.icon,roll.name,s.dodge]];
 for(const [id,icon,name,cooldown,count] of actions){
  const button=document.getElementById(id),time=cooldown>0?cooldown.toFixed(1)+'초':'',key=[icon,name,time,count].join('|');
  if(button.dataset.mobileAction!==key||!button.querySelector('.action-icon')){button.innerHTML='<span class="action-icon" aria-hidden="true">'+(['potion'].includes(id)?iconSVG(icon):skillIconMarkup(id==='skill'?'ultimate:'+(turret?'turret':'burst'):icon))+'</span><span class="action-label">'+name+'</span><span class="action-value">'+(time||(count===undefined?'':count))+'</span>';button.dataset.mobileAction=key;}
  button.setAttribute('aria-label',name+(time?' · 재사용 '+time:count===undefined?'':' · '+count+'개'));button.title=name+(time?' · '+time:'');
 }
}
