import {characterSizes} from './character-sizes.js';
// Approved full-body walk sheet; cache crops at the existing grunt display height.
const sources=[
 {x:0,y:35,w:627,h:580,anchorX:405,feet:601},
 {x:650,y:35,w:604,h:580,anchorX:1000,feet:601},
 {x:0,y:632,w:627,h:595,anchorX:405,feet:1205},
 {x:650,y:640,w:604,h:587,anchorX:1000,feet:1205}
];
const frames=[];
export const wardenWalkState=()=>({ready:frames.length===4,frames:frames.length});
export const wardenWalkReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const atlas=new Image();atlas.onload=()=>{try{
  if(atlas.naturalWidth!==1254||atlas.naturalHeight!==1254){resolve(false);return;}
  const next=sources.map(f=>{const scale=characterSizes.warden/(f.feet-f.y),canvas=document.createElement('canvas');canvas.width=Math.ceil(f.w*scale);canvas.height=Math.ceil(f.h*scale);const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(atlas,f.x,f.y,f.w,f.h,0,0,f.w*scale,f.h*scale);return {canvas,x:(f.x-f.anchorX)*scale,y:29-(f.feet-f.y)*scale};});
  frames.push(...next);resolve(true);
 }catch{resolve(false);}};atlas.onerror=()=>resolve(false);atlas.src=new URL('../../assets/images/warden-walk-atlas.png',import.meta.url).href;
});
export function drawWardenWalk(c,p){
 if(frames.length!==4||!p.moving)return false;
 const index=((Math.floor((p.walk||0)*2/Math.PI)%4)+4)%4,f=frames[index];
 c.save();c.imageSmoothingEnabled=false;c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y));c.restore();return true;
}
