import {DeferredImage} from './asset-requests.js';
// Approved atlas stays untouched. Cache separate feet and rotating upper mechanism.
const frames=[];
const layouts=[{x:.55,feet:.84},{x:.50,feet:.89},{x:.50,feet:.89},{x:.50,feet:.83}];
const load=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const image=new DeferredImage();image.onload=()=>{try{
  if(image.naturalWidth!==1254||image.naturalHeight!==1254){resolve(false);return;}
  const w=627,h=627,scale=.14,split=h*.55,pivotY=h*.38;
  const next=layouts.map((v,i)=>{
   const crop=(y,height)=>{const c=document.createElement('canvas');c.width=Math.ceil(w*scale);c.height=Math.ceil(height*scale);const g=c.getContext('2d');g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(image,(i%2)*w,Math.floor(i/2)*h+y,w,height,0,0,w*scale,height*scale);return c;};
   return {base:crop(split,h-split),head:crop(0,split),x:-w*v.x*scale,baseY:20-(h*v.feet-split)*scale,headY:-pivotY*scale};
  });frames.push(...next);resolve(true);
 }catch{resolve(false);}};image.onerror=()=>resolve(false);image.src=new URL('../../assets/images/crossbow-poses-v2.png',import.meta.url).href;
});
// Optional art failure must leave the existing vector crossbow usable.
export const crossbowArtReady=load.then(()=>true);
export const crossbowArtState=()=>({ready:frames.length===4,frames:frames.length});
export function drawCrossbowArt(c,t,{build=1,recoil=0,ending=false}={}){
 if(frames.length!==4)return false;
 const i=ending?3:build<1?0:recoil>.15?2:1,f=frames[i];
 c.save();c.imageSmoothingEnabled=false;
 c.drawImage(f.base,Math.round(f.x),Math.round(f.baseY));
 c.save();c.translate(0,-3);c.rotate(t.aim||0);c.translate(-recoil*5,0);c.drawImage(f.head,Math.round(f.x),Math.round(f.headY));c.restore();c.restore();return true;
}
