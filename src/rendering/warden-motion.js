import {characterSizes} from './character-sizes.js';
// Approved pose sheet. Body height excludes the raised hammer; feet stay anchored.
const sources=[
 {x:0,y:40,w:627,h:568,anchorX:400,head:50,feet:596},
 {x:660,y:40,w:594,h:568,anchorX:995,head:50,feet:600},
 {x:70,y:608,w:557,h:606,anchorX:385,head:720,feet:1202},
 {x:627,y:690,w:627,h:524,anchorX:935,head:705,feet:1203}
];
const frames=[];
export const wardenMotionState=()=>({ready:frames.length===4,frames:frames.length});
export const wardenMotionReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const atlas=new Image();atlas.onload=()=>{try{
  if(atlas.naturalWidth!==1254||atlas.naturalHeight!==1254){resolve(false);return;}
  const next=sources.map(f=>{const scale=characterSizes.warden/(f.feet-f.head),canvas=document.createElement('canvas');canvas.width=Math.ceil(f.w*scale);canvas.height=Math.ceil(f.h*scale);const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(atlas,f.x,f.y,f.w,f.h,0,0,f.w*scale,f.h*scale);return {canvas,x:(f.x-f.anchorX)*scale,y:29-(f.feet-f.y)*scale};});
  frames.push(...next);resolve(true);
 }catch{resolve(false);}};atlas.onerror=()=>resolve(false);atlas.src=new URL('../../assets/images/warden-motion-atlas.png',import.meta.url).href;
});
export function drawWardenMotion(c,p,attack){
 if(frames.length!==4)return false;
 const index=['windup','air'].includes(attack.stage)?2:attack.stage==='strike'?3:attack.stage==='idle'&&p.moving?(Math.floor((p.walk||0)*2/Math.PI)%2+2)%2:0,f=frames[index];
 c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y));return true;
}
