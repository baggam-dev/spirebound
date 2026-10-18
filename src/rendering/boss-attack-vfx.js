import {drawEnemyBeam} from './enemy-attack-vfx.js';
const TAU=Math.PI*2,clamp=n=>Math.max(0,Math.min(1,n));
const prismHistory=new WeakMap();
function pixel(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);}

// Actual endpoints are supplied by combat's beamEnd; history never enters saved actors.
export function drawPrismRays(c,actor,rays,time,{phase,laser,reduced=false,progress=0}={}){
 const active=laser&&phase==='beam';let h=prismHistory.get(actor);
 if(!h||time<h.time){h={time,active,from:{x:actor.x,y:actor.y},rays:[],fade:-Infinity};prismHistory.set(actor,h);}
 if(time!==h.time){if(h.active&&!active)h.fade=time;h.time=time;h.active=active;}
 if(active){h.from={x:actor.x,y:actor.y};h.rays=rays.map(p=>({...p}));}
 if(phase==='warning'||phase==='salvo'||active){
  for(const end of rays)drawEnemyBeam(c,actor,end,{active,width:26,color:laser?'#f3a3d1':'#7ae6df',progress,reduced});
 }
 const age=(time-h.fade)/.16;
 if(active||reduced||age<0||age>=1)return;
 c.save();c.globalAlpha*=.22*(1-age);c.lineWidth=1;c.lineCap='butt';c.setLineDash([2,12]);c.strokeStyle='#d9a1c4';
 for(const end of h.rays){c.beginPath();c.moveTo(h.from.x,h.from.y);c.lineTo(end.x,end.y);c.stroke();}
 c.restore();
}

// The stripe is judgmentStripe itself, never the perspective shape in the concept PNG.
export function drawJudgmentStripe(c,z,{flash=false,remaining=.18,progress=0,reduced=false}={}){
 const horizontal=z.w>z.h,length=horizontal?z.w:z.h,width=horizontal?z.h:z.w;
 const age=clamp(1-remaining/.18),impact=flash&&age<.6;
 c.save();c.beginPath();c.rect(z.x,z.y,z.w,z.h);c.clip();c.translate(z.x,z.y);
 if(!horizontal){c.translate(z.w,0);c.rotate(Math.PI/2);}
 c.setLineDash([]);c.lineCap='butt';
 if(!flash){
  c.fillStyle='#9b73551a';c.fillRect(0,0,length,width);
  c.strokeStyle='#e7b87e';c.lineWidth=1;c.globalAlpha*=.6+.3*clamp(progress);
  for(let x=3;x<length;x+=18){c.beginPath();c.moveTo(x,2);c.lineTo(Math.min(length,x+7),2);c.moveTo(x,width-2);c.lineTo(Math.min(length,x+7),width-2);c.stroke();}
  for(let x=32;x<length;x+=reduced?150:90){c.beginPath();c.moveTo(x-3,width/2-4);c.lineTo(x+1,width/2);c.lineTo(x-3,width/2+4);c.stroke();}
 }else{
  c.globalAlpha*=impact?(reduced?.35:.6):.25*(1-age);
  if(impact){c.fillStyle='#9f7db5';c.fillRect(0,0,length,width);c.fillStyle='#f4d5a0';c.fillRect(0,width/2-2,length,4);}
  c.strokeStyle=impact?'#ffe8b8':'#bb9a83';c.lineWidth=1;
  for(let x=8;x<length;x+=reduced?70:35){const yy=width/2+((Math.floor(x/35)%3)-1)*width*.18;c.beginPath();c.moveTo(x-6,yy+3);c.lineTo(x,yy-2);c.lineTo(x+7,yy+1);c.stroke();if(impact&&!reduced)pixel(c,x,4+(x%Math.max(1,width-8)),1,3,'#f9d9a8');}
 }
 c.restore();
}

export function drawFrostRain(c,a,{flash=false,progress=0,reduced=false}={}){
 if(!(a.radius>0))return;
 const r=a.radius,age=clamp(1-(a.time??0)/.4),impact=flash&&age<.45;
 c.save();c.beginPath();c.arc(a.x,a.y,r,0,TAU);c.clip();c.translate(a.x,a.y);c.setLineDash([]);c.lineCap='butt';
 if(!flash){
  c.fillStyle='#70b4ce12';c.fillRect(-r,-r,2*r,2*r);c.strokeStyle='#b0dfed';c.lineWidth=1;c.globalAlpha*=.55+.3*clamp(progress);
  const n=reduced?8:12;
  for(let i=0;i<n;i++){const angle=i*TAU/n;c.beginPath();c.arc(0,0,r-2,angle-.04,angle+.04);c.stroke();c.save();c.rotate(angle);c.beginPath();c.moveTo(r-8,-3);c.lineTo(r-15,0);c.lineTo(r-8,3);c.stroke();c.restore();}
  pixel(c,-1,-4,2,8,'#c4e8f1');pixel(c,-4,-1,8,2,'#c4e8f1');
 }else{
  c.globalAlpha*=impact?(reduced?.55:.8):.4*(1-age);
  for(let i=0;i<(reduced?6:14);i++){
   const angle=i*2.4,rr=r*Math.sqrt((i+.5)/14)*.8,x=Math.cos(angle)*rr,y=Math.sin(angle)*rr;
   if(impact){const h=5+(i%4)*3;c.strokeStyle='#a3d8ef';c.lineWidth=1;c.beginPath();c.moveTo(x,y-h);c.lineTo(x,y);c.stroke();pixel(c,x-2,y,5,1,'#e0f4fa');if(!reduced)pixel(c,x+2,y-3,2,2,'#a4d4ee');}
   else pixel(c,x+(i%2?1:-1)*age*5,y-age*4,2,1,'#b4dfef');
  }
 }
 c.restore();
}
