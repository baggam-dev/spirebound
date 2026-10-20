import {DeferredImage} from './asset-requests.js';
import {characterSizes} from './character-sizes.js';
const frames=[],motion=new WeakMap(),scale=characterSizes.grunt/470;
export const demonCaptainSpriteState=()=>({ready:frames.length===6});
export const demonCaptainSpriteReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const atlas=new DeferredImage();atlas.onload=()=>{try{
  if(atlas.naturalWidth!==1536||atlas.naturalHeight!==1024){resolve(false);return;}
  for(const f of [
   {x:55,y:10,w:440,h:490,ax:240,feet:490},
   {x:600,y:10,w:420,h:490,ax:780,feet:495},
   {x:1090,y:10,w:420,h:490,ax:1280,feet:495},
   {x:20,y:570,w:480,h:420,ax:245,feet:980},
   {x:510,y:530,w:540,h:460,ax:775,feet:980},
   {x:1090,y:515,w:435,h:485,ax:1300,feet:990}
  ]){
   const canvas=document.createElement('canvas');canvas.width=Math.ceil(f.w*scale);canvas.height=Math.ceil(f.h*scale);
   const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(atlas,f.x,f.y,f.w,f.h,0,0,f.w*scale,f.h*scale);
   frames.push({canvas,x:(f.x-f.ax)*scale,y:21-(f.feet-f.y)*scale});
  }resolve(true);
 }catch{frames.length=0;resolve(false);}};atlas.onerror=()=>resolve(false);atlas.src=new URL('../../assets/images/demon-captain-reference-atlas.png',import.meta.url).href;
});
export function drawDemonCaptainSprite(c,e,time=0,reduced=false,staticPose=false){
 if(e.type!=='demonCaptain'||frames.length!==6)return false;
 let face=1,index=0;
 if(!staticPose){
  let p=motion.get(e);if(!p){p={x:e.x,y:e.y,step:0,face:1};motion.set(e,p);}
  const dx=e.x-p.x,dy=e.y-p.y,moved=Math.hypot(dx,dy);p.x=e.x;p.y=e.y;
  if(Math.abs(dx)>.1)p.face=Math.sign(dx);
  if(moved<40&&!(e.frozen>0))p.step+=moved;
  face=e.attackPhase&&Number.isFinite(e.aim)?(Math.cos(e.aim)<0?-1:1):p.face;
  index=e.attackPhase==='warning'?3:e.attackPhase==='dash'?4:e.attackPhase==='recover'?5:moved>.05&&!reduced&&!(e.frozen>0)?1+Math.floor(p.step/12)%2:0;
 }
 const f=frames[index];c.save();c.translate(Math.round(e.x),Math.round(e.y));c.scale(face,1);c.imageSmoothingEnabled=false;c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y));
 if(!staticPose&&e.escapeDepth){c.strokeStyle='#e6a0aa';c.lineWidth=1.5;c.beginPath();c.moveTo(-18,11);c.lineTo(-23,15);c.moveTo(18,11);c.lineTo(23,15);c.stroke();}
 c.restore();return true;
}
export function drawDemonCaptainEffects(c,e,reduced=false){
 if(e.type!=='demonCaptain'||!Number.isFinite(e.aim))return;
 if(e.attackPhase!=='warning'&&e.attackPhase!=='dash')return;
 c.save();c.translate(e.x,e.y);c.rotate(e.aim);
 if(e.attackPhase==='warning'){
  // Preserve the old 160px direction cue; this is not the exact dash distance.
  c.strokeStyle='#edaa9c';c.lineWidth=1;c.globalAlpha=.55;c.setLineDash([5,5]);c.beginPath();c.moveTo(0,0);c.lineTo(160,0);c.stroke();c.setLineDash([]);
  c.beginPath();c.moveTo(150,-6);c.lineTo(160,0);c.lineTo(150,6);c.stroke();
 }else if(!reduced&&!(e.frozen>0)){
  const fade=Math.max(0,Math.min(1,e.attackTime/.42));c.strokeStyle='#bb8eaa';c.lineWidth=2;c.globalAlpha=.3*fade;
  for(const side of [-1,1]){c.beginPath();c.moveTo(-10,side*12);c.lineTo(-34,side*15);c.stroke();}
 }
 c.restore();
}
