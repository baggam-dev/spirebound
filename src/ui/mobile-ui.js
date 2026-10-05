const header=document.querySelector('header');
const menu=document.createElement('button');
menu.id='mobileMenu';menu.textContent='메뉴';menu.setAttribute('aria-expanded','false');header.append(menu);
menu.setAttribute('aria-label','메뉴 열기');
menu.addEventListener('click',()=>{const open=header.classList.toggle('mobile-open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'메뉴 닫기':'메뉴 열기');});
header.addEventListener('click',e=>{if(e.target.closest('button')&&e.target!==menu){header.classList.remove('mobile-open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','메뉴 열기');}});
header.addEventListener('keydown',e=>{if(e.key!=='Escape'||!header.classList.contains('mobile-open'))return;e.preventDefault();e.stopPropagation();header.classList.remove('mobile-open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','메뉴 열기');menu.focus();});
const fullscreen=document.createElement('button');fullscreen.id='fullscreen';fullscreen.textContent='전체 화면';fullscreen.hidden=!document.fullscreenEnabled;header.insertBefore(fullscreen,menu);
fullscreen.addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{fullscreen.textContent='전체 화면 불가';}});
document.addEventListener('fullscreenchange',()=>{fullscreen.textContent=document.fullscreenElement?'화면 복귀':'전체 화면';});

const hud=document.getElementById('runHUD');let activeTip=null,tipTimer;
function closeTip(){activeTip?.classList.remove('tip-open');activeTip?.blur();activeTip=null;clearTimeout(tipTimer);}
hud.addEventListener('click',e=>{const item=e.target.closest('.hud-item');if(!item)return;const same=activeTip===item;closeTip();if(!same){activeTip=item;item.classList.add('tip-open');tipTimer=setTimeout(closeTip,4000);}});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.hud-item'))closeTip();});
window.addEventListener('blur',closeTip);
