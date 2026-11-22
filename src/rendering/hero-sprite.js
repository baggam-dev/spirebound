import {DeferredImage} from './asset-requests.js';
import {characterSizes} from './character-sizes.js';
// Original generated reference-style atlas. Cache its four frames at game size.
const sourceFrames=[
 {x:64,y:108,w:419,h:554,anchorX:240,feet:658},
 {x:578,y:108,w:417,h:555,anchorX:755,feet:659},
 {x:1066,y:110,w:451,h:549,anchorX:1275,feet:655},
 {x:1601,y:70,w:468,h:593,anchorX:1785,feet:659}
];
const scale=characterSizes.hero/546,frames=[];
export const heroSpriteState=()=>({ready:frames.length===4,frames:frames.length,bodyHeight:characterSizes.hero});
export const heroSpriteReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const atlas=new DeferredImage();atlas.onload=()=>{try{
  if(atlas.naturalWidth!==2079||atlas.naturalHeight!==756){resolve(false);return;}
  const next=sourceFrames.map(f=>{const canvas=document.createElement('canvas');canvas.width=Math.ceil(f.w*scale);canvas.height=Math.ceil(f.h*scale);const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(atlas,f.x,f.y,f.w,f.h,0,0,f.w*scale,f.h*scale);return {canvas,x:(f.x-f.anchorX)*scale,y:22-(f.feet-f.y)*scale};});frames.push(...next);resolve(true);
 }catch{resolve(false);}};atlas.onerror=()=>resolve(false);atlas.src=new URL('../../assets/images/hero-reference-atlas.png',import.meta.url).href;
});
export const heroFrameIndex=p=>p.recoil>.45?3:p.moving?(Math.sin(p.walk)>=0?1:2):0;
// A deliberate belt seam and leg-only window, paired with authored cast upper layers.
export function drawHeroWalkLower(c,p){
 if(frames.length!==4)return false;const f=frames[p.moving?(Math.sin(p.walk)>=0?1:2):0];
 c.save();c.beginPath();c.rect(-14,-4,32,27);c.clip();c.imageSmoothingEnabled=false;c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y));c.restore();return true;
}
export function drawHeroSprite(c,p){
 if(frames.length!==4)return false;const f=frames[heroFrameIndex(p)];
 c.save();c.imageSmoothingEnabled=false;c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y));c.restore();return true;
}
