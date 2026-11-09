import {DeferredImage} from './asset-requests.js';
import {characterSizes} from './character-sizes.js';
// Approved full-body walk sheet; cache crops at the existing grunt display height.
const sources=[
 {x:0,y:35,w:627,h:580,anchorX:405,feet:601},
 {x:650,y:35,w:604,h:580,anchorX:1000,feet:601},
 {x:0,y:632,w:627,h:595,anchorX:405,feet:1205},
 {x:650,y:640,w:604,h:587,anchorX:1000,feet:1205}
];
const frames=[],smooth=[];
export const wardenWalkState=()=>({ready:smooth.length===8||frames.length===4,frames:smooth.length||frames.length});
const legacyReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const atlas=new DeferredImage();atlas.onload=()=>{try{
  if(atlas.naturalWidth!==1254||atlas.naturalHeight!==1254){resolve(false);return;}
  const next=sources.map(f=>{const scale=characterSizes.warden/(f.feet-f.y),canvas=document.createElement('canvas');canvas.width=Math.ceil(f.w*scale);canvas.height=Math.ceil(f.h*scale);const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(atlas,f.x,f.y,f.w,f.h,0,0,f.w*scale,f.h*scale);return {canvas,x:(f.x-f.anchorX)*scale,y:29-(f.feet-f.y)*scale};});
  frames.push(...next);resolve(true);
 }catch{resolve(false);}};atlas.onerror=()=>resolve(false);atlas.src=new URL('../../assets/images/warden-walk-atlas.png',import.meta.url).href;
});
const smoothReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const im=new DeferredImage();im.onload=()=>{try{
  if(im.naturalWidth!==1774||im.naturalHeight!==887){resolve(false);return;}
  const w=im.naturalWidth/4,h=im.naturalHeight/2,feet=h*.918,scale=characterSizes.warden/(feet-28);
  for(let i=0;i<8;i++){const canvas=document.createElement('canvas');canvas.width=Math.ceil(w*scale);canvas.height=Math.ceil(h*scale);const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(im,(i%4)*w,Math.floor(i/4)*h,w,h,0,0,w*scale,h*scale);smooth.push({canvas,x:-w*.57*scale,y:29-feet*scale});}resolve(true);
 }catch{smooth.length=0;resolve(false);}};im.onerror=()=>resolve(false);im.src=new URL('../../assets/images/warden-walk-v2.png',import.meta.url).href;
});
export const wardenWalkReady=Promise.all([legacyReady,smoothReady]).then(([old,next])=>old||next);
export function drawWardenWalk(c,p){
 const active=smooth.length===8?smooth:frames;if(!active.length||!p.moving)return false;
 const count=active.length,index=((Math.floor((p.walk||0)*count/(Math.PI*2))%count)+count)%count,f=active[index];
 c.save();c.imageSmoothingEnabled=false;c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y));c.restore();return true;
}
