import {DeferredImage} from './asset-requests.js';
import {characterSizes} from './character-sizes.js';
// Approved full-body walk sheet; cache crops at the existing grunt display height.
const sources=[
 {x:153,y:25,w:459,h:596,anchorX:350,feet:615},
 {x:720,y:25,w:448,h:600,anchorX:930,feet:619},
 {x:163,y:644,w:452,h:591,anchorX:350,feet:1228},
 {x:728,y:649,w:437,h:591,anchorX:930,feet:1233}
];
const frames=[];
export const archerWalkState=()=>({ready:frames.length===4,frames:frames.length});
export const archerWalkReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const atlas=new DeferredImage();atlas.onload=()=>{try{
  if(atlas.naturalWidth!==1254||atlas.naturalHeight!==1254){resolve(false);return;}
  const next=sources.map(f=>{const scale=characterSizes.grunt/(f.feet-f.y),canvas=document.createElement('canvas');canvas.width=Math.ceil(f.w*scale);canvas.height=Math.ceil(f.h*scale);const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(atlas,f.x,f.y,f.w,f.h,0,0,f.w*scale,f.h*scale);return {canvas,x:(f.x-f.anchorX)*scale,y:21-(f.feet-f.y)*scale};});
  frames.push(...next);resolve(true);
 }catch{resolve(false);}};atlas.onerror=()=>resolve(false);atlas.src=new URL('../../assets/images/archer-walk-atlas.png',import.meta.url).href;
});
export function drawArcherWalk(c,p){
 if(frames.length!==4||!p.moving)return false;
 const index=((Math.floor((p.walk||0)*2/Math.PI)%4)+4)%4,f=frames[index];
 c.save();c.imageSmoothingEnabled=false;c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y));c.restore();return true;
}
