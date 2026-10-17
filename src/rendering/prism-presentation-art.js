import {prismPresentationPose} from './prism-presentation-state.js';
import {cleanDetachedCrop} from './sprite-crop.js';
import {characterSizes} from './character-sizes.js';
const poses=new Map();
// Main-core midpoint anchors at local y=-12, excluding satellite extents.
// One fixed scale preserves the low height of the final remains.
const frames=[
 ['arrival',0,0,520,522,275,280],['awaken',520,0,510,522,770,225],
 ['light',1030,0,506,522,1280,255],['heavy',0,522,540,502,275,725],
 ['death',540,522,485,502,775,735],['rest',1025,522,511,502,1280,775]
];
export const prismPresentationArtState=()=>({ready:poses.size===6,keys:[...poses.keys()]});
export const prismPresentationArtReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const image=new Image();image.onload=()=>{try{
  if(image.naturalWidth!==1536||image.naturalHeight!==1024){resolve(false);return;}
  for(const [key,x,y,w,h,ax,ay] of frames){
   const scale=characterSizes.warden/400,canvas=document.createElement('canvas');canvas.width=Math.ceil(w*scale);canvas.height=Math.ceil(h*scale);
   const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(image,x,y,w,h,0,0,w*scale,h*scale);cleanDetachedCrop(canvas);
   // Remains settle below the hover center instead of growing to full height.
   poses.set(key,{canvas,x:(x-ax)*scale,y:(key==='rest'?18:-12)+(y-ay)*scale});
  }resolve(true);
 }catch{resolve(false);}};image.onerror=()=>resolve(false);image.src=new URL('../../assets/images/prism-presentation-poses-v2.png',import.meta.url).href;
});
export function drawPrismPose(c,pose){const f=poses.get(pose);if(!f)return false;c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y));return true;}
export function drawPrismPresentation(c,e,options={}){const pose=prismPresentationPose(e,options);return !!pose&&drawPrismPose(c,pose);}
export function drawPrismDeath(c,f,{reduced=false}={}){
 if(!f.prism||!poses.has('death')||!poses.has('rest'))return false;
 const age=Math.max(0,Math.min(1,1-f.t/f.duration));c.save();c.beginPath();c.rect(25,45,910,455);c.clip();
 c.globalAlpha*=Math.min(1,(1-age)*2);c.translate(Math.round(f.x),Math.round(f.y));c.scale(f.prismScale??1,f.prismScale??1);c.imageSmoothingEnabled=false;
 drawPrismPose(c,reduced||age>.42?'rest':'death');c.restore();return true;
}
