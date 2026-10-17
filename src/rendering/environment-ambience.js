import {objectPoint} from '../world/object-positions.js';
import {doorArrival} from '../world/doors.js';
import {fountainPoint} from '../world/fountain.js';
import {drawEnvironmentProp,environmentArtLoaded} from './environment-art.js';
const plans=new WeakMap();
const mix=n=>{n=Math.imul(n^(n>>>16),0x45d9f3b);n=Math.imul(n^(n>>>16),0x45d9f3b);return (n^(n>>>16))>>>0;};
const torches=[{x:85,y:82},{x:875,y:82},{x:85,y:455},{x:875,y:455}];
const overlaps=(x,y,rx,ry,o)=>x+rx>o.x-8&&x-rx<o.x+o.w+8&&y+ry>o.y-8&&y-ry<o.y+o.h+8;
export function environmentPlan(s,r){
 const key=[s.seed,s.floor,r.x,r.y,r.objectPosition?.x,r.objectPosition?.y,r.chestPosition?.x,r.chestPosition?.y,...(r.obstacles||[]).flatMap(o=>[o.x,o.y,o.w,o.h])].join(':');const cached=plans.get(r);if(cached?.key===key)return cached.plan;
 const seed=mix((s.seed||1)^Math.imul(s.floor+1,73471)^Math.imul((r.x||0)+17,99173)^Math.imul((r.y||0)+31,51787)),puddles=[],chips=[],doors=[0,1,2,3].map(d=>doorArrival(r,d)),facilities=[];
 if(['treasure','shrine','fountain','event','up','down','exit'].includes(r.type)||r.type==='boss')facilities.push(objectPoint(r));if(r.hasChest)facilities.push(objectPoint(r,true));if(typeof r.fountainReady==='boolean')facilities.push(fountainPoint(r));
 // Visual-only deterministic scatter: no game RNG and no serialized fields.
 if(s.floor===0)for(let i=0;i<40&&puddles.length<seed%4;i++){
  const h=mix(seed+i*193),x=90+h%780,y=125+(h>>>10)%300,rx=22+(h>>>19)%23,ry=7+(h>>>25)%9;
  if(Math.abs(x-480)<100&&Math.abs(y-270)<85||(r.obstacles||[]).some(o=>overlaps(x,y,rx,ry,o))||doors.some(d=>Math.hypot(x-d.x,y-d.y)<90)||facilities.some(q=>Math.hypot(x-q.x,y-q.y)<95)||puddles.some(q=>Math.hypot(x-q.x,y-q.y)<105))continue;
  puddles.push(Object.freeze({x,y,rx,ry,phase:h%628/100,shape:h%3}));
 }
 if(s.floor===0)for(let i=0;i<14;i++){const h=mix(seed+i*389),x=70+h%820,y=(i%2?390:95)+(h>>>16)%45;if(!(r.obstacles||[]).some(o=>overlaps(x,y,7,4,o))&&!doors.some(q=>Math.hypot(q.x-x,q.y-y)<70))chips.push(Object.freeze({x,y,phase:h%628/100}));}
 const plan=Object.freeze({puddles:Object.freeze(puddles),chips:Object.freeze(chips),seed});plans.set(r,{key,plan});return plan;
}
export function drawEnvironmentFloorLife(c,s,r,reduced=false){
 if(s.floor!==0)return;const plan=environmentPlan(s,r),t=reduced?0:s.elapsed;c.save();c.beginPath();c.rect(26,45,908,455);c.clip();
 for(const p of plan.puddles){c.save();c.translate(p.x,p.y);c.fillStyle='#71868a25';c.beginPath();c.moveTo(-p.rx,-p.ry*.3);c.lineTo(-p.rx*.7,-p.ry);c.lineTo(p.rx*.38,-p.ry*.8);c.lineTo(p.rx,-p.ry*.16);c.lineTo(p.rx*.7,p.ry*.7);c.lineTo(-p.rx*.45,p.ry);c.closePath();c.fill();c.strokeStyle='#aab9ad38';c.lineWidth=1;c.beginPath();c.moveTo(-p.rx*.65,-p.ry*.7);c.lineTo(-p.rx*.15,-p.ry*.75);c.moveTo(p.rx*.35,p.ry*.6);c.lineTo(p.rx*.65,p.ry*.45);c.stroke();if(!reduced){const age=((t*.33+p.phase)%1+1)%1;c.globalAlpha=(1-age)*.2;c.strokeStyle='#b3c2bb';c.beginPath();c.ellipse(p.rx*.15,-1,2+age*9,.7+age*3,0,0,Math.PI*1.5);c.stroke();}c.restore();}
 for(const p of plan.chips){c.fillStyle='#59614c55';c.fillRect(p.x,p.y,5,2);c.fillStyle='#9090772b';c.fillRect(p.x+2,p.y-1,3,1);if(!reduced){const phase=((t*.15+p.phase)%1+1)%1;c.fillStyle='#c8c2a0';c.globalAlpha=Math.sin(phase*Math.PI)*.13;c.fillRect(p.x+Math.sin(phase*4)*5,p.y-phase*17,1,1);c.globalAlpha=1;}}
 c.restore();
}
export function drawEnvironmentTorches(c,s,r,reduced=false){
 const t=reduced?0:s.elapsed;c.save();c.beginPath();c.rect(25,44,910,464);c.clip();
 for(const [i,p] of torches.entries()){
  if(s.floor!==0||!environmentArtLoaded()){c.fillStyle='#111720';c.fillRect(p.x-10,p.y+12,20,5);c.fillStyle=s.floor>=8?'#4c414a':'#756b55';c.fillRect(p.x-6,p.y-3,12,15);c.fillStyle=s.floor>=8?'#9b7172':'#b49d6c';c.fillRect(p.x-5,p.y,10,3);}
  if(s.floor===0&&environmentArtLoaded())drawEnvironmentProp(c,15,p.x,p.y+17,16);
  const fire=s.floor>=9?'#c58bb8':s.floor===8?'#e28564':'#ffbf65',pulse=reduced?1:.9+.08*Math.sin(t*8+i*1.7)+.04*Math.sin(t*17+i);
  c.save();c.translate(p.x,p.y-9);c.globalAlpha=.12*pulse;const light=c.createRadialGradient(0,0,2,0,0,44);light.addColorStop(0,fire);light.addColorStop(1,fire+'00');c.fillStyle=light;c.fillRect(-44,-44,88,88);c.globalAlpha=1;
  c.fillStyle=fire;c.fillRect(-3,-6*pulse,6,10*pulse);c.fillStyle='#fff1bd';c.fillRect(-1,-3*pulse,2,6*pulse);
  if(!reduced)for(let j=0;j<4;j++){const age=((t*(.48+j*.09)+i*.21+j*.25)%1+1)%1;c.globalAlpha=Math.sin(age*Math.PI)*.65;c.fillStyle=j%2?'#e5a360':'#f1ce8c';c.fillRect(Math.round(Math.sin(age*5+i+j)*5+age*(j%2?5:-3)),Math.round(-9-age*27),j===0?2:1,2);}
  c.restore();
 }
 c.restore();
}
function fountain(c,p,available,t,reduced){
 drawEnvironmentProp(c,available?6:7,p.x,p.y+11,64);
 if(!available)return;c.save();c.translate(p.x,p.y);c.strokeStyle='#b5e8dc';c.globalAlpha=.55;c.lineWidth=1;c.beginPath();c.moveTo(0,-22);c.lineTo(0,-5);c.stroke();c.fillStyle='#d2f4e7';c.fillRect(-1,-20,1,13);if(!reduced){for(let i=0;i<2;i++){const age=(t*.7+i*.5)%1;c.globalAlpha=(1-age)*.45;c.beginPath();c.ellipse(0,-4,3+age*14,1+age*4,0,0,Math.PI*2);c.stroke();}}c.restore();
}
export function drawEnvironmentFacilities(c,s,r,reduced=false){
 if(!environmentArtLoaded())return false;const q=objectPoint(r),t=reduced?0:s.elapsed;c.save();
 if(r.hasChest){const p=objectPoint(r,true);drawEnvironmentProp(c,r.chestUsed?5:4,p.x,p.y+7,52);}
 if(r.type==='treasure')drawEnvironmentProp(c,r.used?5:4,q.x,q.y+7,52);
 if(r.type==='shrine')drawEnvironmentProp(c,r.used?9:8,q.x,q.y+11,51);
 if(r.type==='event')drawEnvironmentProp(c,r.used?11:10,q.x,q.y+11,49);
 if(r.type==='fountain')fountain(c,q,!r.used,t,reduced);
 if(['up','down','exit'].includes(r.type)||r.type==='boss'&&r.used&&s.floor<s.floors.length-1){const relic=r.relicOffers&&!r.relicClaimed;drawEnvironmentProp(c,relic?4:r.type==='exit'?14:r.type==='down'?13:12,q.x,q.y+12,r.type==='exit'?52:60);}
 if(typeof r.fountainReady==='boolean')fountain(c,fountainPoint(r),r.fountainReady,t,reduced);
 if(!reduced&&['shrine','event'].includes(r.type)&&!r.used){c.fillStyle=r.type==='shrine'?'#bca6cf':'#b39591';for(let i=0;i<2;i++){const age=(t*.3+i*.5)%1;c.globalAlpha=Math.sin(age*Math.PI)*.3;c.fillRect(q.x-10+i*20+Math.sin(age*4)*3,q.y-17-age*17,1,2);}}
 c.restore();return true;
}
