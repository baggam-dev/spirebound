import {wardenPresentationPose} from './warden-presentation-state.js';
import {cleanDetachedCrop} from './sprite-crop.js';
import {characterSizes} from './character-sizes.js';
const poses=new Map();
// Source crops, feet-center, feet baseline and standing head-to-feet height.
// Crouched bodies keep the same scale rather than stretching to standing size.
const frames=[
 ['arrival',0,0,540,520,325,502,455],['ready',540,0,520,520,850,507,455],
 ['light',1060,0,476,520,1350,510,455],['heavy',0,520,560,504,330,980,455],
 ['death',560,520,490,504,800,970,455],['rest',1050,520,486,504,1320,990,455]
];
export const wardenPresentationArtState=()=>({ready:poses.size===6,keys:[...poses.keys()]});
export const wardenPresentationArtReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const image=new Image();image.onload=()=>{try{
  if(image.naturalWidth!==1536||image.naturalHeight!==1024){resolve(false);return;}
  for(const [key,x,y,w,h,ax,feet,standing] of frames){
   const scale=characterSizes.warden/standing,canvas=document.createElement('canvas');canvas.width=Math.ceil(w*scale);canvas.height=Math.ceil(h*scale);
   const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(image,x,y,w,h,0,0,w*scale,h*scale);cleanDetachedCrop(canvas);
   poses.set(key,{canvas,x:(x-ax)*scale,y:29-(feet-y)*scale});
  }resolve(true);
 }catch{resolve(false);}};image.onerror=()=>resolve(false);image.src=new URL('../../assets/images/warden-presentation-poses-v1.png',import.meta.url).href;
});
export function drawWardenPose(c,pose){const f=poses.get(pose);if(!f)return false;c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y));return true;}
// Local coordinates: caller already applies feet-centered 1.1 scale and facing.
export function drawWardenPresentation(c,e,options={}){
 const p=wardenPresentationPose(e,options);return !!p&&drawWardenPose(c,p);
}
export function drawWardenDeath(c,f,{reduced=false}={}){
 if(!f.warden||!poses.has('death')||!poses.has('rest'))return false;
 const age=Math.max(0,Math.min(1,1-f.t/f.duration)),alpha=Math.min(1,(1-age)*2);
 c.save();c.beginPath();c.rect(25,45,910,455);c.clip();c.globalAlpha*=alpha;c.translate(Math.round(f.x),Math.round(f.y));
 c.scale(f.wardenScale??1,f.wardenScale??1);
 c.translate(0,29);c.scale(1.1,1.1);c.translate(0,-29);c.scale(f.face<0?-1:1,1);c.imageSmoothingEnabled=false;
 c.filter='saturate(.88)';drawWardenPose(c,reduced||age>.42?'rest':'death');c.restore();return true;
}
