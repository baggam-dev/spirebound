import {drawFeedbackSprite} from './feedback-sprites.js';
import {characterSizes} from './character-sizes.js';
const frames=[],motion=new WeakMap(),scale=characterSizes.grunt/420;
export const ambusherSpriteState=()=>({ready:frames.length===6});
export const ambusherSpriteReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const atlas=new Image();atlas.onload=()=>{try{
  if(atlas.naturalWidth!==1536||atlas.naturalHeight!==1024){resolve(false);return;}
  for(const f of [
   {x:65,y:45,w:350,h:440,ax:245,feet:475},
   {x:585,y:45,w:375,h:440,ax:775,feet:475},
   {x:1090,y:45,w:375,h:440,ax:1280,feet:475},
   {x:55,y:600,w:425,h:315,ax:255,feet:900},
   {x:480,y:580,w:560,h:345,ax:755,feet:915},
   {x:1080,y:535,w:430,h:430,ax:1280,feet:955}
  ]){
   const canvas=document.createElement('canvas');canvas.width=Math.ceil(f.w*scale);canvas.height=Math.ceil(f.h*scale);
   const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(atlas,f.x,f.y,f.w,f.h,0,0,f.w*scale,f.h*scale);
   frames.push({canvas,x:(f.x-f.ax)*scale,y:21-(f.feet-f.y)*scale});
  }resolve(true);
 }catch{frames.length=0;resolve(false);}};atlas.onerror=()=>resolve(false);atlas.src=new URL('../../assets/images/ambusher-reference-atlas.png',import.meta.url).href;
});
export function drawAmbusherSprite(c,e,time=0,reduced=false,staticPose=false){
 if(e.type==='ambusher'&&drawFeedbackSprite(c,e,time,{reduced,staticPose}))return true;
 if(e.type!=='ambusher'||frames.length!==6)return false;
 let face=1,index=0;
 if(!staticPose){
  let p=motion.get(e);if(!p){p={x:e.x,y:e.y,step:0,face:1};motion.set(e,p);}
  const dx=e.x-p.x,dy=e.y-p.y,moved=Math.hypot(dx,dy);p.x=e.x;p.y=e.y;
  if(moved<40&&!(e.frozen>0))p.step+=moved;
  // Fixed attack aim controls facing; approach uses observed horizontal motion.
  if(e.attackPhase&&Number.isFinite(e.aim))p.face=Math.cos(e.aim)<0?-1:1;else if(Math.abs(dx)>.1)p.face=Math.sign(dx);
  face=p.face;
  index=e.attackPhase==='warning'?3:e.attackPhase==='dash'?4:e.attackPhase==='recover'?5:moved>.05&&!reduced&&!(e.frozen>0)?1+Math.floor(p.step/10)%2:0;
 }
 const f=frames[index];c.save();c.translate(Math.round(e.x),Math.round(e.y));c.scale(face,1);c.imageSmoothingEnabled=false;c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y));c.restore();return true;
}
