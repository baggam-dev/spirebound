import {DeferredImage} from './asset-requests.js';
import {locomotion,drawWalkingFrame} from './locomotion.js';
import {characterSizes} from './character-sizes.js';
const frames=[],motion=new WeakMap();
export const mordoPhase2SpriteState=()=>({ready:frames.length===2});
export const mordoPhase2SpriteReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const atlas=new DeferredImage();atlas.onload=()=>{try{
  if(atlas.naturalWidth!==1774||atlas.naturalHeight!==887){resolve(false);return;}
  for(const f of [{x:0,y:110,w:945,h:777,anchorX:570,feet:874,bodyTop:125},{x:950,y:0,w:824,h:887,anchorX:1440,feet:874,bodyTop:195}]){
   const scale=characterSizes.warden/(f.feet-f.bodyTop),canvas=document.createElement('canvas');canvas.width=Math.ceil(f.w*scale);canvas.height=Math.ceil(f.h*scale);const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(atlas,f.x,f.y,f.w,f.h,0,0,f.w*scale,f.h*scale);frames.push({canvas,x:(f.x-f.anchorX)*scale,y:29-(f.feet-f.y)*scale});
  }resolve(true);
 }catch{frames.length=0;resolve(false);}};atlas.onerror=()=>resolve(false);atlas.src=new URL('../../assets/images/mordo-phase2-reference-atlas.png',import.meta.url).href;
});
export function drawMordoPhase2Sprite(c,e,attack,time=0,{reduced=false,staticPose=false}={}){
 if(frames.length!==2||e.variant!=='king'||e.hp/e.max>.65||e.hp/e.max<=.3)return false;
 let p=motion.get(e);if(!p){p={x:e.x,face:1};motion.set(e,p);}const dx=e.x-p.x;if(Math.abs(dx)>.1)p.face=Math.sign(dx);p.x=e.x;
 const active=['windup','strike'].includes(attack.stage),aim=e.darkAttack?.aim??e.darkFlash?.aim??e.facing,face=active&&Number.isFinite(aim)?(Math.cos(aim)<0?-1:1):p.face,f=frames[active?1:0];
 c.save();c.translate(Math.round(e.x),Math.round(e.y));c.fillStyle='#0005';c.fillRect(-32,27,64,9);c.translate(0,attack.bodyY||0);c.scale(face,1);c.imageSmoothingEnabled=false;const g=locomotion(e,time,{staticPose,reduced,blocked:e.kingTransition>0||e.kneel>0||e.darkAttack?.kind==='blink'||e.darkAttack?.moving,stride:28});drawWalkingFrame(c,f,g,{feet:29,hip:14,weight:.75});
 if(e.escapeDepth){c.strokeStyle='#df899e';c.lineWidth=1.5;c.beginPath();c.moveTo(-16,12);c.lineTo(-21,8);c.moveTo(16,12);c.lineTo(21,8);c.stroke();}c.restore();return true;
}


