import {characterSizes} from './character-sizes.js';
const frames=[],motion=new WeakMap();
export const starBearerSpriteState=()=>({ready:frames.length===2});
export const starBearerSpriteReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const atlas=new Image();atlas.onload=()=>{try{
  if(atlas.naturalWidth!==1774||atlas.naturalHeight!==887){resolve(false);return;}
  for(const f of [{x:120,y:55,w:720,h:820,anchorX:505,feet:854,bodyTop:75},{x:895,y:55,w:850,h:820,anchorX:1320,feet:854,bodyTop:75}]){
   const scale=characterSizes.grunt/(f.feet-f.bodyTop),canvas=document.createElement('canvas');canvas.width=Math.ceil(f.w*scale);canvas.height=Math.ceil(f.h*scale);const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(atlas,f.x,f.y,f.w,f.h,0,0,f.w*scale,f.h*scale);frames.push({canvas,x:(f.x-f.anchorX)*scale,y:21-(f.feet-f.y)*scale});
  }resolve(true);
 }catch{frames.length=0;resolve(false);}};atlas.onerror=()=>resolve(false);atlas.src=new URL('../../assets/images/star-bearer-reference-atlas.png',import.meta.url).href;
});
export function drawStarBearerSprite(c,e,attack){
 if(frames.length!==2||e.type!=='starBearer')return false;
 let p=motion.get(e);if(!p){p={x:e.x,face:1};motion.set(e,p);}const dx=e.x-p.x;if(Math.abs(dx)>.1)p.face=Math.sign(dx);p.x=e.x;
 const active=['windup','strike'].includes(attack.stage),aim=e.darkAttack?.aim??e.darkFlash?.aim??e.facing,face=active&&Number.isFinite(aim)?(Math.cos(aim)<0?-1:1):p.face,f=frames[active?1:0];
 c.save();c.translate(Math.round(e.x),Math.round(e.y));c.fillStyle='#0005';c.fillRect(-21,19,42,7);c.translate(0,attack.bodyY||0);c.scale(face,1);c.imageSmoothingEnabled=false;c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y));
 if(e.escapeDepth){c.strokeStyle='#df899e';c.lineWidth=1.5;c.beginPath();c.moveTo(-16,12);c.lineTo(-21,8);c.moveTo(16,12);c.lineTo(21,8);c.stroke();}c.restore();return true;
}



