import {DeferredImage} from './asset-requests.js';
import {characterSizes} from './character-sizes.js';
// Approved full-body walk sheet; cache crops at the existing grunt display height.
const sources=[
 {x:0,y:180,w:466,h:630,anchorX:250,feet:799},
 {x:466,y:180,w:444,h:630,anchorX:700,feet:793},
 {x:910,y:180,w:452,h:630,anchorX:1140,feet:800},
 {x:1362,y:180,w:412,h:630,anchorX:1580,feet:799}
];
const frames=[];
const redesign=[];
export const bruteRedesignState=()=>({ready:redesign.length===12,frames:redesign.length});
// Optional art must not match floor-assets moduleReady discovery.
export const bruteRedesignPromise=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const image=new DeferredImage();image.onload=()=>{try{
  if(image.naturalWidth!==1536||image.naturalHeight!==1024){resolve(false);return;}
  const crops=[];
  for(let i=0;i<12;i++){
   const x=i%4*384,y=Math.floor(Math.floor(i/4)*1024/3),end=Math.floor((Math.floor(i/4)+1)*1024/3),scan=document.createElement('canvas');scan.width=384;scan.height=end-y;
   const c=scan.getContext('2d');c.drawImage(image,x,y,384,end-y,0,0,384,end-y);const data=c.getImageData(0,0,384,end-y).data;
   let left=384,top=end-y,right=-1,bottom=-1;
   const pixels=c.getImageData(0,0,384,end-y);
   for(let py=0;py<scan.height;py++)for(let px=0;px<384;px++){const at=(py*384+px)*4+3;if(data[at]>192){left=Math.min(left,px);right=Math.max(right,px);top=Math.min(top,py);bottom=Math.max(bottom,py);}else pixels.data[at]=0;}
   c.putImageData(pixels,0,0);
   if(right<left||bottom<top){resolve(false);return;}crops.push({scan,left,top,w:right-left+1,h:bottom-top+1});
  }
  const scale=characterSizes.brute/crops[0].h;
  for(const f of crops){const canvas=document.createElement('canvas');canvas.width=Math.ceil(f.w*scale);canvas.height=Math.ceil(f.h*scale);const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(f.scan,f.left,f.top,f.w,f.h,0,0,f.w*scale,f.h*scale);redesign.push({canvas,x:-canvas.width/2,y:24-f.h*scale});}
  resolve(true);
 }catch{redesign.length=0;resolve(false);}};image.onerror=()=>resolve(false);image.src=new URL('../../assets/images/brute-redesign-v1.png',import.meta.url).href;
});
export function bruteRedesignPose(e,p={},hit=null,{reduced=false}={}){
 if(e.hp<=0)return 11;
 if(e.meleeAttack)return e.meleeAttack.stage==='windup'?6:e.meleeAttack.stage==='strike'?7:8;
 if(e.phase==='windup')return 3;if(e.phase==='air')return 4;
 if(e.phase==='swing')return e.phaseTime>.12?6:7;if(e.phase==='recover')return e.phaseTime>.85?5:8;
 if(hit?.kind==='hit')return hit.heavy?10:9;
 return !reduced&&p.moving?1+Math.abs(Math.floor((p.walk||0)/Math.PI))%2:0;
}
export function drawBruteRedesign(c,e,p,hit,options){
 if(e.type!=='brute'||redesign.length!==12)return false;
 const f=redesign[bruteRedesignPose(e,p,hit,options)];
 c.save();try{c.scale(p.face||1,1);c.imageSmoothingEnabled=false;c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y));}finally{c.restore();}return true;
}
export const bruteWalkState=()=>({ready:frames.length===4,frames:frames.length});
export const bruteWalkReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const atlas=new DeferredImage();atlas.onload=()=>{try{
  if(atlas.naturalWidth!==1774||atlas.naturalHeight!==887){resolve(false);return;}
  const next=sources.map(f=>{const scale=characterSizes.brute/(f.feet-f.y),canvas=document.createElement('canvas');canvas.width=Math.ceil(f.w*scale);canvas.height=Math.ceil(f.h*scale);const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(atlas,f.x,f.y,f.w,f.h,0,0,f.w*scale,f.h*scale);return {canvas,x:(f.x-f.anchorX)*scale,y:24-(f.feet-f.y)*scale};});
  frames.push(...next);resolve(true);
 }catch{resolve(false);}};atlas.onerror=()=>resolve(false);atlas.src=new URL('../../assets/images/brute-walk-atlas.png',import.meta.url).href;
});
export function drawBruteWalk(c,p){
 if(frames.length!==4||!p.moving)return false;
 const index=((Math.floor((p.walk||0)*2/Math.PI)%4)+4)%4,f=frames[index];
 c.save();c.imageSmoothingEnabled=false;c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y));c.restore();return true;
}
