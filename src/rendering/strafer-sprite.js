import {DeferredImage} from './asset-requests.js';
import {drawFeedbackSprite} from './feedback-sprites.js';
import {characterSizes} from './character-sizes.js';
const frames=[],motion=new WeakMap(),scale=characterSizes.grunt/460;
export const straferSpriteState=()=>({ready:frames.length===6});
export const straferSpriteReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const atlas=new DeferredImage();atlas.onload=()=>{try{
  if(atlas.naturalWidth!==1536||atlas.naturalHeight!==1024){resolve(false);return;}
  for(const f of [
   {x:55,y:10,w:400,h:485,ax:235,feet:485},
   {x:495,y:15,w:490,h:480,ax:710,feet:485},
   {x:1060,y:10,w:465,h:480,ax:1260,feet:475},
   {x:25,y:525,w:470,h:470,ax:220,feet:985},
   {x:555,y:525,w:465,h:470,ax:750,feet:985},
   {x:1060,y:520,w:465,h:480,ax:1250,feet:990}
  ]){
   const canvas=document.createElement('canvas');canvas.width=Math.ceil(f.w*scale);canvas.height=Math.ceil(f.h*scale);
   const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(atlas,f.x,f.y,f.w,f.h,0,0,f.w*scale,f.h*scale);
   frames.push({canvas,x:(f.x-f.ax)*scale,y:21-(f.feet-f.y)*scale});
  }resolve(true);
 }catch{frames.length=0;resolve(false);}};atlas.onerror=()=>resolve(false);atlas.src=new URL('../../assets/images/strafer-reference-atlas.png',import.meta.url).href;
});
export function drawStraferSprite(c,e,time=0,reduced=false,staticPose=false){
 if(e.type==='strafer'&&drawFeedbackSprite(c,e,time,{reduced,staticPose}))return true;
 if(e.type!=='strafer'||frames.length!==6)return false;
 let face=1,index=0;
 if(!staticPose){
  let p=motion.get(e);if(!p){p={x:e.x,y:e.y,step:0,face:1};motion.set(e,p);}
  const dx=e.x-p.x,dy=e.y-p.y,moved=Math.hypot(dx,dy);p.x=e.x;p.y=e.y;
  if(moved<40&&!(e.frozen>0))p.step+=moved;
  // Strafe direction and facing differ: retain the latest actual firing aim.
  if(Number.isFinite(e.aim))p.face=Math.cos(e.aim)<0?-1:1;
  face=p.face;
  index=e.attackPhase==='warning'?3:e.attackPhase==='recover'?(e.attackTime>1.1?4:5):moved>.05&&!reduced&&!(e.frozen>0)?1+Math.floor(p.step/10)%2:0;
 }
 const f=frames[index];c.save();c.translate(Math.round(e.x),Math.round(e.y));c.scale(face,1);c.imageSmoothingEnabled=false;c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y));c.restore();return true;
}
