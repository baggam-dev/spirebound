import {skillVisualProfile,drawSkillHitMark} from './skill-visuals.js';
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
export function drawElementHit(c,f){
 if(!duration[f.hitElement])return false;
 if(f.t<=0)return true;
 const age=1-Math.min(1,f.t/f.duration),spread=1-(1-age)**2,fade=Math.min(1,(1-age)*2),angle=f.angle||0;
 c.save();c.beginPath();c.rect(25,45,910,455);c.clip();c.translate(Math.round(f.x),Math.round(f.y));if(f.small)c.scale(.7,.7);c.globalAlpha=fade*.9;
 const v=skillVisualProfile(f.hitElement,{[f.hitElement]:f.level,evolutions:{[f.hitElement]:f.branch}});
 if(f.hitElement==='chain'&&f.toX!==undefined){
  const dx=f.toX-f.x,dy=f.toY-f.y,length=Math.hypot(dx,dy)||1,points=[];
  for(let i=0;i<=8;i++){const bend=i===0||i===8?0:(i%2?1:-1)*(3+Math.floor(age*3));points.push([dx*i/8-dy/length*bend,dy*i/8+dx/length*bend]);}
  stroke(c,points,'#8d83d999',v.branch==='surge'?6:4);stroke(c,points,v.branch==='surge'?'#fff2b5':'#dae8ff',v.branch==='surge'?3:1+v.level*.3);if(v.branch==='web')stroke(c,points.map(([x,y],i)=>[x,y+(i===0||i===8?0:i%2?3:-3)]),'#b9a3ed',1);spark(c,dx,dy,3,'#fff2c8');c.restore();return true;
 }
 if(f.hitElement==='fire'){
  // Hot core breaks into rising orange embers; no opaque explosion disk.
  for(let i=0;i<v.particles;i++){const a=angle+(i-(v.particles-1)/2)*.63,r=4+spread*(10+i%3*4),x=Math.cos(a)*r,y=Math.sin(a)*r-age*12;
   box(c,x-2,y-3,4,6,'#bd443c');box(c,x-1,y-5,3,5,'#ff914a');box(c,x,y-4,2,2,'#ffe2a0');}
  if(age<.38){spark(c,0,0,Math.round(8*(1-age)), '#ffb65d');spark(c,0,0,3,'#fff1c6');}
 }else if(f.hitElement==='frost'){
  for(let i=0;i<v.particles;i++){const a=angle+i*Math.PI*2/v.particles,r=4+spread*(14+i%2*5),x=Math.cos(a)*r,y=Math.sin(a)*r+age*age*7;
   const dx=Math.cos(a)*5,dy=Math.sin(a)*5;stroke(c,[[x-dx,y-dy],[x,y-2],[x+dx,y+dy]],'#387dae',4);stroke(c,[[x-dx,y-dy],[x+dx,y+dy]],'#b3edff',2);box(c,x,y-1,2,2,'#efffff');}
  if(age<.45){stroke(c,[[-7,0],[7,0]],'#efffff',2);stroke(c,[[0,-7],[0,7]],'#efffff',2);}
 }else if(f.hitElement==='poison'){
  for(let i=0;i<7;i++){const a=angle+(i-(v.particles-1)/2)*.85,r=3+spread*(10+i%3*4),x=Math.cos(a)*r,y=Math.sin(a)*r-9*Math.sin(age*Math.PI)+age*age*16,size=i%3===0?5:3;
   box(c,x-1,y-1,size+2,size+2,'#315a46');box(c,x,y,size,size,'#86d96b');box(c,x,y,2,2,'#dbf59b');if(age>.55)box(c,x,y+size,2,3,'#62b865');}
  if(age<.3){box(c,-5,-3,10,6,'#91df6b');box(c,-3,-5,6,10,'#91df6b');box(c,-2,-2,4,3,'#e0f8ac');}
 }else{
  // One brief contact flash and short branching bolts, not a screen flash.
  const phase=Math.floor(age*3);
  for(let i=0;i<Math.min(7,v.level+3);i++){const a=angle+i*Math.PI*2/Math.min(7,v.level+3),r=12+spread*10,dx=Math.cos(a),dy=Math.sin(a),bend=(i%2?1:-1)*(3+phase);
   const points=[[dx*3,dy*3],[dx*r*.45-dy*bend,dy*r*.45+dx*bend],[dx*r*.65+dy*bend,dy*r*.65-dx*bend],[dx*r,dy*r]];
   stroke(c,points,'#8e80e1',4);stroke(c,points,'#e5e5ff',1);}
  if(age<.4)spark(c,0,0,5,'#fff5c9');
 }
 drawSkillHitMark(c,f,age);c.restore();return true;
}
