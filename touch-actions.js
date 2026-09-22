// Secondary touch pointers do not consistently generate click on mobile browsers.
export function bindCombatAction(button,action){
 let lastTouch=-Infinity;
 button.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')return;e.preventDefault();if(button.disabled)return;lastTouch=Date.now();action();});
 button.addEventListener('click',e=>{if(e.detail!==0&&Date.now()-lastTouch<800){e.preventDefault();return;}if(!button.disabled)action();});
}
