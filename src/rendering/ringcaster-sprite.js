import {characterSizes} from './character-sizes.js';
const frames=[],scale=characterSizes.grunt/550;
export const ringcasterSpriteState=()=>({ready:frames.length===4});
export const ringcasterSpriteReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const atlas=new Image();atlas.onload=()=>{try{
  if(atlas.naturalWidth!==1254||atlas.naturalHeight!==1254){resolve(false);return;}
  for(const f of [
   {x:225,y:0,w:265,h:615,ax:350,feet:610},
   {x:790,y:0,w:270,h:615,ax:925,feet:610},
   {x:45,y:615,w:610,h:600,ax:355,feet:1205},
   {x:790,y:620,w:385,h:595,ax:930,feet:1205}
  ]){
   const canvas=document.createElement('canvas');canvas.width=Math.ceil(f.w*scale);canvas.height=Math.ceil(f.h*scale);
   const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(atlas,f.x,f.y,f.w,f.h,0,0,f.w*scale,f.h*scale);
   frames.push({canvas,x:(f.x-f.ax)*scale,y:21-(f.feet-f.y)*scale});
  }resolve(true);
 }catch{frames.length=0;resolve(false);}};atlas.onerror=()=>resolve(false);atlas.src=new URL('../../assets/images/ringcaster-reference-atlas.png',import.meta.url).href;
});
export function drawRingcasterSprite(c,e,staticPose=false){
 if(e.type!=='ringcaster'||frames.length!==4)return false;
 const index=staticPose?0:e.attackPhase==='warning'?1:e.attackPhase==='recover'?(e.attackTime>2.22?2:3):0,f=frames[index];
 const face=!staticPose&&Number.isFinite(e.aim)&&Math.cos(e.aim)<0?-1:1;
 c.save();c.translate(Math.round(e.x),Math.round(e.y));c.scale(face,1);c.imageSmoothingEnabled=false;c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y));c.restore();return true;
}
