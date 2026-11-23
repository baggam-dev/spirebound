// A display gate over an already-created/saved reward dialog. No deferred grants,
// random choices, callbacks owning run progression, or additional game pauses.
export const BOSS_REWARD_REVEAL_AT=1.2;
export const bossRewardPending=(age,mode)=>Number.isFinite(age)&&age>=0&&age<BOSS_REWARD_REVEAL_AT&&['level','main','evolution','utility','relic'].includes(mode);
export function createBossRewardReveal(overlay,{onSkip,document=overlay.ownerDocument}={}){
 let held=null,skip=null,prior=null;
 function clear(){
  if(!held)return;
  const focus=!!skip&&document.activeElement===skip,dialog=held;
  dialog.inert=prior.inert;
  if(prior.aria===null)dialog.removeAttribute('aria-hidden');else dialog.setAttribute('aria-hidden',prior.aria);
  overlay.classList.remove('boss-reward-pending');skip?.remove();held=null;skip=null;prior=null;
  if(focus&&dialog.isConnected)dialog.focus({preventScroll:true});
 }
 return {
  active:()=>!!held,
  clear,
  sync(age,mode){
   const dialog=overlay.firstElementChild;
   if(!bossRewardPending(age,mode)||!dialog?.classList.contains('panel')){clear();return false;}
   if(held===dialog)return true;
   clear();held=dialog;prior={inert:dialog.inert,aria:dialog.getAttribute('aria-hidden')};
   dialog.inert=true;dialog.setAttribute('aria-hidden','true');overlay.classList.add('boss-reward-pending');
   skip=document.createElement('button');skip.className='boss-clear-continue';skip.type='button';skip.textContent='보상 선택으로 · 건너뛰기';
   skip.addEventListener('keydown',event=>{
    if(event.key==='Tab'){event.preventDefault();event.stopPropagation();skip.focus({preventScroll:true});}
    else if(event.key==='Escape'){event.preventDefault();event.stopPropagation();onSkip?.();}
   });
   skip.addEventListener('click',event=>{event.stopPropagation();onSkip?.();});overlay.append(skip);skip.focus({preventScroll:true});return true;
  }
 };
}
