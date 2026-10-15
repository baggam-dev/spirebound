import {characterSizes} from './character-sizes.js';
const frames=[],motion=new WeakMap(),scale=characterSizes.grunt/470;
export const demonArcherSpriteState=()=>({ready:frames.length===6});
export const demonArcherSpriteReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const atlas=new Image();atlas.onload=()=>{try{
  if(atlas.naturalWidth!==1536||atlas.naturalHeight!==1024){resolve(false);return;}
  for(const f of [
   {x:90,y:15,w:365,h:490,ax:275,feet:495},
   {x:595,y:15,w:405,h:490,ax:790,feet:495},
   {x:1110,y:15,w:410,h:490,ax:1315,feet:495},
   {x:20,y:505,w:505,h:490,ax:250,feet:990},
   {x:525,y:505,w:510,h:490,ax:765,feet:990},
   {x:1100,y:545,w:430,h:450,ax:1310,feet:990}
  ]){
   const canvas=document.createElement('canvas');canvas.width=Math.ceil(f.w*scale);canvas.height=Math.ceil(f.h*scale);
   const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(atlas,f.x,f.y,f.w,f.h,0,0,f.w*scale,f.h*scale);
   frames.push({canvas,x:(f.x-f.ax)*scale,y:21-(f.feet-f.y)*scale});
  }resolve(true);
 }catch{frames.length=0;resolve(false);}};atlas.onerror=()=>resolve(false);atlas.src=new URL('../../assets/images/demon-archer-reference-atlas.png',import.meta.url).href;
});
export function drawDemonArcherSprite(c,e,time=0,reduced=false,staticPose=false){
 if(e.type!=='demonArcher'||frames.length!==6)return false;
 let face=1,index=0;
 if(!staticPose){
  let p=motion.get(e);if(!p){p={x:e.x,y:e.y,step:0,face:1};motion.set(e,p);}
  const dx=e.x-p.x,dy=e.y-p.y,moved=Math.hypot(dx,dy);p.x=e.x;p.y=e.y;
  if(Math.abs(dx)>.1)p.face=Math.sign(dx);
  if(moved<40&&!(e.frozen>0))p.step+=moved;
  face=e.attackPhase&&Number.isFinite(e.aim)?(Math.cos(e.aim)<0?-1:1):p.face;
  index=e.attackPhase==='warning'?3:e.attackPhase==='recover'?(e.attackTime>.5?4:5):moved>.05&&!reduced&&!(e.frozen>0)?1+Math.floor(p.step/10)%2:0;
 }
 const f=frames[index];c.save();c.translate(Math.round(e.x),Math.round(e.y));c.scale(face,1);c.imageSmoothingEnabled=false;c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y));
 if(!staticPose&&e.escapeDepth){c.strokeStyle='#e6a0aa';c.lineWidth=1.5;c.beginPath();c.moveTo(-16,11);c.lineTo(-20,15);c.moveTo(16,11);c.lineTo(20,15);c.stroke();}
 c.restore();return true;
}
export function drawDemonArcherWarning(c,e){
 if(e.type!=='demonArcher'||e.attackPhase!=='warning'||!Number.isFinite(e.aim))return;
 // Direction cues only; 230px is not an attack range or a wall intersection.
 c.save();c.translate(e.x,e.y);c.strokeStyle='#dbbca2';c.lineWidth=1;c.globalAlpha=.55;c.setLineDash([5,5]);
 for(const offset of [-.14,.14]){const a=e.aim+offset;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a)*230,Math.sin(a)*230);c.stroke();}
 c.restore();
}
