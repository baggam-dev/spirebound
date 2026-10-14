import {characterSizes} from './character-sizes.js';
const frames=[];
export const pulseTurretSpriteState=()=>({ready:frames.length===2});
export const pulseTurretSpriteReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const atlas=new Image();atlas.onload=()=>{try{
  if(atlas.naturalWidth!==1774||atlas.naturalHeight!==887){resolve(false);return;}
  for(const f of [{x:100,y:100,w:780,h:730,anchorX:500},{x:910,y:100,w:780,h:730,anchorX:1315}]){
   const scale=characterSizes.grunt/(810-125),canvas=document.createElement('canvas');canvas.width=Math.ceil(f.w*scale);canvas.height=Math.ceil(f.h*scale);const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(atlas,f.x,f.y,f.w,f.h,0,0,f.w*scale,f.h*scale);frames.push({canvas,x:(f.x-f.anchorX)*scale,y:21-(810-f.y)*scale});
  }resolve(true);
 }catch{frames.length=0;resolve(false);}};atlas.onerror=()=>resolve(false);atlas.src=new URL('../../assets/images/pulse-turret-reference-atlas.png',import.meta.url).href;
});
export function drawPulseTurretSprite(c,e,attack){
 if(frames.length!==2||e.type!=='pulseTurret')return false;
 const active=['windup','strike'].includes(attack.stage),f=frames[active?1:0];
 // A grounded stationary emitter: aiming changes the ground gap, not the base.
 c.save();c.translate(Math.round(e.x),Math.round(e.y));c.fillStyle='#0005';c.fillRect(-25,19,50,7);c.imageSmoothingEnabled=false;c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y));
 if(e.escapeDepth){c.strokeStyle='#df899e';c.lineWidth=1.5;c.beginPath();c.moveTo(-20,12);c.lineTo(-25,8);c.moveTo(20,12);c.lineTo(25,8);c.stroke();}c.restore();return true;
}
