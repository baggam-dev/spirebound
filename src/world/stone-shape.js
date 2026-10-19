// Small broken corners shared by wall rendering, body collision and attack line tests.
// Presentation-independent, deterministic geometry; no saved fields or gameplay RNG.
const cache=new WeakMap();
function hash(o){let n=Math.imul(Math.round(o.x)+37,73856093)^Math.imul(Math.round(o.y)+53,19349663)^Math.imul(Math.round(o.w)+Math.round(o.h)*31,83492791);n=Math.imul(n^(n>>>16),1274126177);return (n^(n>>>13))>>>0;}
export function stoneFragments(o){
 const old=cache.get(o);if(old&&old.type===o.type&&old.x===o.x&&old.y===o.y&&old.w===o.w&&old.h===o.h&&old.hole===!!o.demonHole&&old.bolt===!!o.demonBolt)return old.parts;
 let parts=[o];
 // Outer boundary strips, tiny connector strips and non-stone furniture remain solid.
 if(o.type==='wall'&&!o.demonHole&&!o.demonBolt&&o.x>=25&&o.y>=35&&o.x+o.w<=935&&o.y+o.h<=508&&o.w>=32&&o.h>=26){
  const n=hash(o),limit=Math.min(9,Math.floor(Math.min(o.w,o.h)/4/3)*3);
  const corners=Array.from({length:4},(_,i)=>((n>>>(i*5))%3===0?0:Math.min(limit,6+3*((n>>>(i*5+2))%2))));
  if(!corners.some(Boolean))corners[n%4]=limit;
  const [tl,tr,bl,br]=corners,ys=new Set([0,o.h]);
  for(let y=3;y<=Math.max(tl,tr);y+=3)ys.add(y);
  for(let y=3;y<=Math.max(bl,br);y+=3)ys.add(o.h-y);
  const levels=[...ys].sort((a,b)=>a-b);parts=[];
  for(let i=0;i<levels.length-1;i++){
   const y=levels[i],h=levels[i+1]-y;
   const left=Math.max(0,tl-y,bl-(o.h-y-h)),right=Math.max(0,tr-y,br-(o.h-y-h));
   parts.push(Object.freeze({x:o.x+left,y:o.y+y,w:o.w-left-right,h,type:'wall'}));
  }
 }
 const result=Object.freeze(parts);cache.set(o,{type:o.type,x:o.x,y:o.y,w:o.w,h:o.h,hole:!!o.demonHole,bolt:!!o.demonBolt,parts:result});return result;
}
