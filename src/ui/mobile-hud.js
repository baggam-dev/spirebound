import {utilitySkills} from '../combat/utility.js';
import {skillIconMarkup} from '../rendering/skill-icons.js';
import {iconSVG} from '../rendering/pixel-icons.js';
import {rollAction} from '../combat/roll.js';
const coarse=window.matchMedia('(pointer:coarse)'),hud=document.getElementById('runHUD');
const map=document.createElement('canvas');map.id='mobileMinimap';map.width=166;map.height=160;map.setAttribute('role','img');map.setAttribute('aria-label','탐색 지도 · 방 형태·문 연결과 현재 위치');hud.append(map);
export function renderHUDMinimap(draw,ctx,...args){
 const c=map.getContext('2d');c.clearRect(0,0,166,160);c.save();c.translate(-772,-12);draw(c,...args,{translucent:coarse.matches});c.restore();
}
let menuArtStarted=false;
function prepareMobileMenuArt(){
 if(menuArtStarted)return;menuArtStarted=true;
 const art=new Image(),url=new URL('../../assets/images/mobile-menu-icons-v1.png',import.meta.url).href;
 art.onload=()=>{const header=document.querySelector('body>header');for(const id of ['pause','mobileMenu']){const button=document.getElementById(id);if(!button)continue;const icon=document.createElement('span');icon.className='mobile-menu-art '+id;icon.setAttribute('aria-hidden','true');button.append(icon);if(id==='pause')button.setAttribute('aria-label','일시정지');}header.style.setProperty('--mobile-menu-atlas',`url("${url}")`);header.classList.add('has-mobile-menu-art');};
 // Preserve the existing text symbols if the approved PNG cannot load.
 art.src=url;
}
export function updateMobileActions(s){
 if(!coarse.matches||!s)return;
 prepareMobileMenuArt();
 const p=s.player,turret=p.evolutions?.ultimate==='turret',roll=rollAction(p);
 const actions=[['potion','potion','물약',s.potionCooldown,p.potions],['utility',p.utility||'focus',utilitySkills.find(k=>k.id===p.utility)?.name||'액티브',s.utilityCooldown],['skill',turret?'turret':'ultimate',turret?'석궁':'화살비',s.skill],['dodge',roll.icon,roll.name,s.dodge]];
 for(const [id,icon,name,cooldown,count] of actions){
  const button=document.getElementById(id),time=cooldown>0?cooldown.toFixed(1)+'초':'',key=[icon,name,time,count].join('|');
  if(button.dataset.mobileAction!==key||!button.querySelector('.action-icon')){button.innerHTML='<span class="action-icon" aria-hidden="true">'+(['potion'].includes(id)?iconSVG(icon):skillIconMarkup(id==='skill'?'ultimate:'+(turret?'turret':'burst'):icon))+'</span><span class="action-label">'+name+'</span><span class="action-value">'+(time||(count===undefined?'':count))+'</span>';button.dataset.mobileAction=key;}
  button.setAttribute('aria-label',name+(time?' · 재사용 '+time:count===undefined?'':' · '+count+'개'));button.title=name+(time?' · '+time:'');
 }
}
