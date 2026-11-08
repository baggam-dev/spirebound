import {skillVisualProfile,drawSkillHitMark} from './skill-visuals.js';
import {drawElementCrown} from './skill-burst-art.js';
// Short, local hit accents. No combat RNG, damage, or persistent particle state.
const duration={fire:.3,frost:.34,poison:.4,chain:.22};
export function elementHitEffects(player,point,origin,elemental=true,shard=false){
 const angle=Math.atan2(point.y-origin.y,point.x-origin.x);
 return Object.keys(duration).filter(kind=>player[kind]&&(elemental||kind==='poison'||kind==='frost'&&shard)).map(kind=>({
  x:point.x,y:point.y,hitElement:kind,angle,t:duration[kind],duration:duration[kind],small:shard,level:skillVisualProfile(kind,player).level,branch:skillVisualProfile(kind,player).branch
 }));
}
export function limitElementHits(effects,max=48){
 let skip=Math.max(0,effects.reduce((n,f)=>n+!!f.hitElement,0)-max);
 return effects.filter(f=>!f.hitElement||skip--<=0);
}
const box=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
function stroke(c,points,color,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(Math.round(x),Math.round(y)):c.moveTo(Math.round(x),Math.round(y)));c.stroke();}
function spark(c,x,y,size,color){box(c,x-size,y-1,size*2+1,3,color);box(c,x-1,y-size,3,size*2+1,color);}
export function drawElementHit(c,f,reduced=false){
 if(!duration[f.hitElement])return false;
 if(f.t<=0)return true;
 const age=1-Math.min(1,f.t/f.duration),spread=1-(1-age)**2,fade=(1-age)**1.5,angle=f.angle||0;
 c.save();c.beginPath();c.rect(25,45,910,455);c.clip();c.translate(Math.round(f.x),Math.round(f.y));if(f.small)c.scale(.7,.7);c.globalAlpha*=fade*.9;
 const v=skillVisualProfile(f.hitElement,{[f.hitElement]:f.level,evolutions:{[f.hitElement]:f.branch}});
 const count=reduced?3:Math.min(8,v.particles);
 if(f.hitElement==='chain'&&f.toX!==undefined){
  const dx=f.toX-f.x,dy=f.toY-f.y,length=Math.hypot(dx,dy)||1,points=[];
  for(let i=0;i<=8;i++){const bend=i===0||i===8?0:(i%2?1:-1)*(3+Math.floor(age*3));points.push([dx*i/8-dy/length*bend,dy*i/8+dx/length*bend]);}
  if(!reduced)stroke(c,points,'#8d83d999',v.branch==='surge'?6:4);stroke(c,points,v.branch==='surge'?'#fff2b5':'#dae8ff',reduced?1:v.branch==='surge'?3:1+v.level*.3);if(!reduced&&v.branch==='web')stroke(c,points.map(([x,y],i)=>[x,y+(i===0||i===8?0:i%2?3:-3)]),'#b9a3ed',1);spark(c,dx,dy,reduced?1:3,'#fff2c8');c.restore();return true;
 }
 if(f.hitElement==='fire'){
  // Hot core breaks into rising orange embers; no opaque explosion disk.
  for(let i=0;i<count;i++){const a=angle+(i-(count-1)/2)*.4,r=2+spread*(10+i%3*4),x=Math.cos(a)*r,y=Math.sin(a)*r-age*10,h=Math.max(2,Math.round(6*(1-age)));
   if(!reduced)box(c,x-2,y-2,4,h,'#bd443c');box(c,x-1,y-3,2,h,'#ff874a');if(age<.55)box(c,x,y-3,1,2,'#fff0b5');}
  if(age<.3){spark(c,0,0,reduced?2:4,'#ffb65d');box(c,-1,-1,3,3,'#fff0b5');}
 }else if(f.hitElement==='frost'){
  for(let i=0;i<count;i++){const a=angle+(i-(count-1)/2)*.65,r=3+spread*(14+i%2*5),x=Math.cos(a)*r,y=Math.sin(a)*r+age*age*7,size=(reduced?3:5)*(1-age*.6),dx=Math.cos(a)*size,dy=Math.sin(a)*size;
   c.fillStyle='#387dae';c.beginPath();c.moveTo(x-dx,y-dy);c.lineTo(x-dy*.45,y+dx*.45);c.lineTo(x+dx,y+dy);c.lineTo(x+dy*.45,y-dx*.45);c.closePath();c.fill();stroke(c,[[x-dx,y-dy],[x+dx,y+dy]],'#87d8f3',reduced?1:2);if(age<.6)box(c,x,y-1,1,2,'#eaffff');}
  if(age<.3)spark(c,0,0,reduced?2:4,'#eaffff');
 }else if(f.hitElement==='poison'){
  for(let i=0;i<(reduced?3:6);i++){const a=angle+(i-(reduced?1:2.5))*.55,r=3+spread*(10+i%3*4),x=Math.cos(a)*r,y=Math.sin(a)*r-9*Math.sin(age*Math.PI)+age*age*16,size=Math.max(1,Math.round((i%3===0?4:3)*(1-age*.6)));
   if(!reduced)box(c,x-1,y,size+2,size+1,'#315a46');box(c,x,y,size,size,'#85d469');box(c,x,y-2,1,3,'#dff5a1');if(!reduced&&age>.55)box(c,x,y-4,2,1,'#62b865');}
  if(age<.3){box(c,-2,-3,4,6,'#85d469');box(c,-1,-2,2,3,'#dff5a1');}
 }else{
  // One brief contact flash and short branching bolts, not a screen flash.
  const phase=Math.floor(age*3);
  for(let i=0;i<(reduced?2:Math.min(5,v.level+2));i++){const a=angle+(i-(reduced?.5:(Math.min(5,v.level+2)-1)/2))*.85,r=8+spread*12,dx=Math.cos(a),dy=Math.sin(a),bend=(i%2?1:-1)*(2+phase);
   const points=[[dx*3,dy*3],[dx*r*.45-dy*bend,dy*r*.45+dx*bend],[dx*r*.65+dy*bend,dy*r*.65-dx*bend],[dx*r,dy*r]];
   if(!reduced)stroke(c,points,'#ad9bed',3);stroke(c,points,'#f5e6ff',1);}
  if(age<.3)spark(c,0,0,reduced?2:3,'#f5e6ff');
 }
 if(!reduced){drawElementCrown(c,f.hitElement,age,v.level);drawSkillHitMark(c,f,age);}c.restore();return true;
}
