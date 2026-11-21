import {doorArrival} from '../world/doors.js';
import {fountainPoint} from '../world/fountain.js';
import {environmentSurface} from './environment-material.js';

const plans=new WeakMap(),surfaces=new Map();
const hash=n=>{n=Math.imul(n^(n>>>16),0x45d9f3b);return (n^(n>>>16))>>>0;};
const overlap=(x,y,rx,ry,o)=>x+rx>o.x&&x-rx<o.x+o.w&&y+ry>o.y&&y-ry<o.y+o.h;
export function floorDecalPlan(s,r){
 const stamp=[s.seed,s.floor,!!s.key,r.x,r.y,r.type,!!r.gate,!!r.tutorial,r.hasChest,r.objectPosition?.x,r.objectPosition?.y,r.chestPosition?.x,r.chestPosition?.y,r.fountainReady!==undefined,r.sealEngine?.x,r.sealEngine?.y,...(r.doorPositions||[]),...(r.obstacles||[]).flatMap(o=>[o.x,o.y,o.w,o.h])].join(':');
 const cached=plans.get(r);if(cached?.stamp===stamp)return cached.plan;
 let seed=hash((s.seed||1)^Math.imul(s.floor+1,73471)^Math.imul((r.x||0)+17,99173)^Math.imul((r.y||0)+31,51787)^(s.key?0x6a19b:0));
 const random=()=>{seed=hash(seed+0x9e3779b9);return seed/4294967296;};
 const items=[],doors=[0,1,2,3].map(d=>doorArrival(r,d)),facilities=[];
 if(['treasure','shrine','fountain','event','up','down','exit','boss'].includes(r.type))facilities.push(r.objectPosition||{x:480,y:115});
 if(r.hasChest)facilities.push(r.chestPosition||{x:600,y:115});if(r.fountainReady!==undefined)facilities.push(fountainPoint(r));if(r.sealEngine)facilities.push(r.sealEngine);
 const safe=(x,y,radius)=>{
  if(x-radius<45||x+radius>915||y-radius<70||y+radius>475)return false;
  if(x+radius>325&&x-radius<635&&y+radius>175&&y-radius<365)return false;
  if(doors.some(p=>Math.hypot(p.x-x,p.y-y)<radius+78)||facilities.some(p=>Math.hypot(p.x-x,p.y-y)<radius+65))return false;
  if((r.obstacles||[]).some(o=>overlap(x,y,radius+7,radius+7,o)))return false;
  return !items.some(p=>Math.hypot(p.x-x,p.y-y)<radius+p.radius+22);
 };
 const ordinary=r.type==='normal'&&!r.gate&&!r.tutorial;
 const pool=!ordinary?['damp','puddle','scuff','moss']:s.floor>=8?['damp','scuff','scuff','blood']:s.floor===4||s.floor===5?['moss','moss','damp','puddle','scuff','blood']:s.key?['damp','puddle','scuff','blood','blood','moss']:['damp','puddle','scuff','moss',...(ordinary&&s.floor>0?['blood']:[])];
 const place=(kind,radius)=>{
  for(let attempt=0;attempt<36;attempt++){const x=Math.round((90+random()*780)/2)*2,y=Math.round((100+random()*340)/2)*2;if(!safe(x,y,radius))continue;
   const pattern=Math.floor(random()*0x7fffffff),angle=(random()-.5)*.6;items.push(Object.freeze({kind,x,y,radius,pattern,angle,opacity:.65+random()*.3}));return;
  }
 };
 // Ritual marks are rare environmental chalk, never a combat zone or a room obligation.
 if(ordinary&&random()<(s.key ? .28 : .1))place('ritual',48+Math.floor(random()*8));
 const count=3+Math.floor(random()*4);for(let i=0;i<count;i++)place(pool[Math.floor(random()*pool.length)],18+Math.floor(random()*15));
 const plan=Object.freeze({stamp,items:Object.freeze(items)});plans.set(r,{stamp,plan});return plan;
}
function blob(c,radius,seed,color,stretch=.6){
 c.fillStyle=color;c.beginPath();
 for(let i=0;i<14;i++){const a=i*Math.PI/7,k=.7+(hash(seed+i*193)%30)/100,x=Math.cos(a)*radius*k,y=Math.sin(a)*radius*k*stretch;if(i)c.lineTo(x,y);else c.moveTo(x,y);}c.closePath();c.fill();
}
function paintDecal(c,p){
 c.save();c.translate(p.x,p.y);c.rotate(p.angle);c.globalAlpha=p.opacity;
 const r=p.radius,h=p.pattern;
 if(p.kind==='ritual'){
  // Five true points with missing chalk segments; no bright enclosing danger ring.
  const points=Array.from({length:5},(_,i)=>({x:Math.cos(-Math.PI/2+i*Math.PI*2/5)*r,y:Math.sin(-Math.PI/2+i*Math.PI*2/5)*r*.66}));
  c.strokeStyle='#b2aaa547';c.lineWidth=1.5;
  for(let i=0;i<5;i++){const a=points[i],b=points[(i+2)%5];for(const [start,end] of [[0,.27],[.34,.69],[.79,1]]){c.beginPath();c.moveTo(a.x+(b.x-a.x)*start,a.y+(b.y-a.y)*start);c.lineTo(a.x+(b.x-a.x)*end,a.y+(b.y-a.y)*end);c.stroke();}}
  c.fillStyle='#b2aaa52b';for(let i=0;i<10;i++){const q=hash(h+i*73);c.fillRect(q%(r*2)-r,(q>>>8)%Math.floor(r)-r/2,2,1);}
 }else if(p.kind==='scuff'){
  c.strokeStyle='#b5b6ae27';c.lineWidth=1;for(let i=0;i<5;i++){const q=hash(h+i*131),x=-r+(q%12),y=-8+i*4;c.beginPath();c.moveTo(x,y);c.lineTo(x+r*.8+(q%9),y-4);c.stroke();}
 }else{
  const colors={damp:'#182c3246',puddle:'#4b697942',blood:'#68363366',moss:'#4c5b363f'};blob(c,r,h,colors[p.kind]);
  if(p.kind==='puddle'){
   blob(c,r*.72,h+37,'#73909a15');c.strokeStyle='#a0b3b92f';c.lineWidth=1;c.beginPath();c.moveTo(-r*.6,-r*.2);c.lineTo(-r*.27,-r*.29);c.moveTo(r*.23,r*.28);c.lineTo(r*.52,r*.18);c.stroke();
   c.fillStyle='#829ba224';c.fillRect(-r*.5,-r*.2,3,1);
  }
  for(let i=0;i<7;i++){
   const q=hash(h+i*173),x=q%(r*2)-r,y=(q>>>9)%Math.floor(r)-r/2,k=2+q%4;
   c.fillStyle=p.kind==='blood'?'#77413b49':p.kind==='moss'?'#69774a32':p.kind==='puddle'?'#607c8929':'#10282c24';c.fillRect(x,y,k,k*.6);
  }
 }
 c.restore();
}
function paint(c,plan){c.save();c.beginPath();c.rect(26,45,908,455);c.clip();for(const p of plan.items)paintDecal(c,p);c.restore();}
export function drawFloorDecals(c,s,r){
 const plan=floorDecalPlan(s,r);let layer=surfaces.get(r);
 if(!layer||layer.plan!==plan){
  const canvas=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(960,540):typeof document!=='undefined'?document.createElement('canvas'):null;
  const cc=canvas?.getContext('2d');if(!cc){paint(c,plan);return;}canvas.width=960;canvas.height=540;paint(cc,plan);layer={plan,canvas:environmentSurface(canvas)};surfaces.delete(r);surfaces.set(r,layer);while(surfaces.size>3)surfaces.delete(surfaces.keys().next().value);
 }
 c.save();c.imageSmoothingEnabled=false;c.drawImage(layer.canvas,0,0);c.restore();
}
