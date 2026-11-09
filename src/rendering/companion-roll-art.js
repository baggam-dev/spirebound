import {DeferredImage} from './asset-requests.js';
import {drawHeroSprite} from './hero-sprite.js';
import {characterSizes} from './character-sizes.js';
// Generated originals stay untouched; equal-cell crops are cached at runtime.
const frames=[];
const rollArtReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const source=new DeferredImage();source.onload=()=>{try{for(let i=0;i<8;i++){
  const sw=source.naturalWidth/4,sh=source.naturalHeight/2,scan=document.createElement('canvas');scan.width=Math.ceil(sw);scan.height=Math.ceil(sh);const c=scan.getContext('2d');c.drawImage(source,(i%4)*sw,Math.floor(i/4)*sh,sw,sh,0,0,sw,sh);
  const pixels=c.getImageData(0,0,scan.width,scan.height).data;let l=scan.width,t=scan.height,r=0,b=0;for(let y=0;y<scan.height;y++)for(let x=0;x<scan.width;x++)if(pixels[(y*scan.width+x)*4+3]>64){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}
  if(r<=l||b<=t){resolve(false);return;}const height=i<4?48:i===7?21:16,width=(r-l+1)/(b-t+1)*height,out=document.createElement('canvas');out.width=Math.ceil(width);out.height=height;const oc=out.getContext('2d');oc.imageSmoothingEnabled=true;oc.drawImage(scan,l,t,r-l+1,b-t+1,0,0,width,height);frames.push(out);
 }resolve(true);}catch{resolve(false);}};source.onerror=()=>resolve(false);source.src=new URL('../../assets/images/companions-roll-v1.png',import.meta.url).href;
});
const dashFrames=[];
const dashArtReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const im=new DeferredImage();im.onload=()=>{try{
  if(im.naturalWidth!==2048||im.naturalHeight!==768){resolve(false);return;}
  const scale=characterSizes.hero/435;
  for(let i=0;i<4;i++){const canvas=document.createElement('canvas');canvas.width=Math.ceil(512*scale);canvas.height=Math.ceil(768*scale);const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(im,i*512,0,512,768,0,0,512*scale,768*scale);dashFrames.push({canvas,x:-230*scale,y:22-630*scale});}resolve(true);
 }catch{dashFrames.length=0;resolve(false);}};im.onerror=()=>resolve(false);im.src=new URL('../../assets/images/hero-draw-dash-v2.png',import.meta.url).href;
});
// Roll/fairy assets remain usable if the new dash atlas fails; slash has a safe idle fallback.
export const companionArtReady=Promise.all([rollArtReady,dashArtReady]).then(([roll])=>roll);
export const dashArtState=()=>({ready:dashFrames.length===4,frames:dashFrames.length});
export function drawRollHero(c,s){
 if(!s.roll)return false;
 if(s.roll.kind==='slash'){
  const q=s.roll,progress=Math.min(1,q.elapsed/q.duration),index=progress<.15?0:progress<.4?1:progress<.8?2:3,f=dashFrames[index];
  c.save();c.translate(Math.round(s.player.x),Math.round(s.player.y));if(q.x<0)c.scale(-1,1);c.rotate(Math.max(-.3,Math.min(.3,q.y*.2)));c.imageSmoothingEnabled=false;
  if(f)c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y));
  else if(!drawHeroSprite(c,{...s.player,recoil:0,moving:false})){c.fillStyle='#63788a';c.fillRect(-5,-26,10,40);c.fillStyle='#dfbc91';c.fillRect(-4,-38,8,10);}
  c.restore();return true;
 }
 const index=Math.min(3,Math.floor(s.roll.elapsed/s.roll.duration*4)),f=frames[index];if(!f)return false;c.save();c.translate(s.player.x,s.player.y+18);if(s.roll.x<0)c.scale(-1,1);c.imageSmoothingEnabled=false;c.drawImage(f,-f.width/2,-f.height);c.restore();return true;
}
export function drawFairy(c,index,x,y,time,reduced=false){const f=frames[index+4];if(!f)return false;c.save();c.translate(Math.round(x),Math.round(y));if(!reduced)c.rotate(Math.sin(time*2+index)*.06);c.imageSmoothingEnabled=false;c.drawImage(f,-f.width/2,-f.height/2);c.restore();return true;}
