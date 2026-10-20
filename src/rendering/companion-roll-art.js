import {DeferredImage} from './asset-requests.js';
import {drawHeroSprite} from './hero-sprite.js';
// Generated originals stay untouched; equal-cell crops are cached at runtime.
const frames=[];
export const companionArtReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const source=new DeferredImage();source.onload=()=>{try{for(let i=0;i<8;i++){
  const sw=source.naturalWidth/4,sh=source.naturalHeight/2,scan=document.createElement('canvas');scan.width=Math.ceil(sw);scan.height=Math.ceil(sh);const c=scan.getContext('2d');c.drawImage(source,(i%4)*sw,Math.floor(i/4)*sh,sw,sh,0,0,sw,sh);
  const pixels=c.getImageData(0,0,scan.width,scan.height).data;let l=scan.width,t=scan.height,r=0,b=0;for(let y=0;y<scan.height;y++)for(let x=0;x<scan.width;x++)if(pixels[(y*scan.width+x)*4+3]>64){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}
  if(r<=l||b<=t){resolve(false);return;}const height=i<4?48:i===7?21:16,width=(r-l+1)/(b-t+1)*height,out=document.createElement('canvas');out.width=Math.ceil(width);out.height=height;const oc=out.getContext('2d');oc.imageSmoothingEnabled=true;oc.drawImage(scan,l,t,r-l+1,b-t+1,0,0,width,height);frames.push(out);
 }resolve(true);}catch{resolve(false);}};source.onerror=()=>resolve(false);source.src=new URL('../../assets/images/companions-roll-v1.png',import.meta.url).href;
});
export function drawRollHero(c,s){if(!s.roll)return false;if(s.roll.kind==='slash'){c.save();c.translate(s.player.x,s.player.y);if(s.roll.x<0)c.scale(-1,1);c.rotate(Math.max(-.3,Math.min(.3,s.roll.y*.2))+.12);const drawn=drawHeroSprite(c,{...s.player,recoil:.2,moving:false});c.restore();return drawn;}const index=Math.min(3,Math.floor(s.roll.elapsed/s.roll.duration*4)),f=frames[index];if(!f)return false;c.save();c.translate(s.player.x,s.player.y+18);if(s.roll.x<0)c.scale(-1,1);c.imageSmoothingEnabled=false;c.drawImage(f,-f.width/2,-f.height);c.restore();return true;}
export function drawFairy(c,index,x,y,time,reduced=false){const f=frames[index+4];if(!f)return false;c.save();c.translate(Math.round(x),Math.round(y));if(!reduced)c.rotate(Math.sin(time*2+index)*.06);c.imageSmoothingEnabled=false;c.drawImage(f,-f.width/2,-f.height/2);c.restore();return true;}
