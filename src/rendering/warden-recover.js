import {DeferredImage} from './asset-requests.js';
import {characterSizes} from './character-sizes.js';
// One fixed scale retains the crouch-to-standing height change.
const sources=[
 {x:50,y:135,w:750,h:589,anchorX:395,feet:650},
 {x:810,y:45,w:660,h:679,anchorX:1070,feet:650},
 {x:1480,y:15,w:692,h:709,anchorX:1705,feet:650}
],frames=[];
export const wardenRecoverState=()=>({ready:frames.length===3,frames:frames.length});
export const wardenRecoverReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const atlas=new DeferredImage();atlas.onload=()=>{try{
  if(atlas.naturalWidth!==2172||atlas.naturalHeight!==724){resolve(false);return;}
  const scale=characterSizes.warden/630,next=sources.map(f=>{const canvas=document.createElement('canvas');canvas.width=Math.ceil(f.w*scale);canvas.height=Math.ceil(f.h*scale);const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(atlas,f.x,f.y,f.w,f.h,0,0,f.w*scale,f.h*scale);return {canvas,x:(f.x-f.anchorX)*scale,y:29-(f.feet-f.y)*scale};});frames.push(...next);resolve(true);
 }catch{resolve(false);}};atlas.onerror=()=>resolve(false);atlas.src=new URL('../../assets/images/warden-recover-atlas.png',import.meta.url).href;
});
export function wardenRecoverProgress(e){return Math.max(0,Math.min(1,1-(e.attackTime||0)/.6));}
export function drawWardenRising(c,remaining){
 if(frames.length!==3)return false;
 const f=frames[Math.min(2,Math.floor(Math.max(0,1-remaining/.4)*3))];c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y));return true;
}
export function drawWardenRecover(c,e){
 if(frames.length!==3||e.pattern!=='slam'||e.attackPhase!=='recover')return false;
 const progress=wardenRecoverProgress(e),f=frames[Math.min(2,Math.floor(progress*3))];
 c.save();c.globalAlpha*=progress>.8?(1-progress)/.2:1;c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y));c.restore();return true;
}
