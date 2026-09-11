export function createInput(stick,onAction){
 const keys=new Set();let pointer=null,axis={x:0,y:0},last={x:0,y:-1},enabled=false;
 const keyActions={q:'potion',f:'skill',' ':'dodge',e:'interact',escape:'pause',i:'bag',h:'help'};
 function reset(){keys.clear();axis={x:0,y:0};if(pointer!==null&&stick.hasPointerCapture?.(pointer))stick.releasePointerCapture(pointer);pointer=null;stick.firstElementChild.style.transform='';}
 function movement(){let x=axis.x+Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),y=axis.y+Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));const n=Math.max(1,Math.hypot(x,y));const vector={x:x/n,y:y/n};if(Math.hypot(vector.x,vector.y)>.1)last=vector;return enabled?vector:{x:0,y:0};}
 window.addEventListener('keydown',e=>{if(e.target?.matches?.('input,textarea,select'))return;const k=e.key.toLowerCase();if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();if(e.repeat)return;if(enabled)keys.add(k);if(keyActions[k])onAction(keyActions[k]);});
 window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',reset);
 function move(e){const b=stick.getBoundingClientRect(),radius=b.width*.35,x=(e.clientX-b.left-b.width/2)/radius,y=(e.clientY-b.top-b.height/2)/radius,n=Math.max(1,Math.hypot(x,y));axis={x:x/n,y:y/n};stick.firstElementChild.style.transform=`translate(${axis.x*radius}px,${axis.y*radius}px)`;}
 stick.addEventListener('pointerdown',e=>{if(!enabled||pointer!==null)return;e.preventDefault();pointer=e.pointerId;stick.setPointerCapture(pointer);move(e);});stick.addEventListener('pointermove',e=>{if(enabled&&pointer===e.pointerId)move(e);});for(const event of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(event,e=>{if(pointer===e.pointerId)reset();});
 return {movement,direction:()=>{const v=movement();return v.x||v.y?v:last;},reset,setEnabled(value){enabled=value;reset();}};
}
