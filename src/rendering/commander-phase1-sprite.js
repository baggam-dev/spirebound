import {locomotion,drawWalkingFrame} from './locomotion.js';
import {characterSizes} from './character-sizes.js';
import {drawSoftField} from './ground-visuals.js';
const frames=[],motion=new WeakMap();
export const commanderPhase1SpriteState=()=>({ready:frames.length===2});
export const commanderPhase1SpriteReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const atlas=new Image();atlas.onload=()=>{try{
  if(atlas.naturalWidth!==1774||atlas.naturalHeight!==887){resolve(false);return;}
  for(const f of [{x:100,y:120,w:750,h:750,anchorX:560,feet:860,bodyTop:165},{x:890,y:0,w:850,h:870,anchorX:1230,feet:860,bodyTop:180}]){
   const scale=characterSizes.warden/(f.feet-f.bodyTop),canvas=document.createElement('canvas');canvas.width=Math.ceil(f.w*scale);canvas.height=Math.ceil(f.h*scale);const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(atlas,f.x,f.y,f.w,f.h,0,0,f.w*scale,f.h*scale);frames.push({canvas,x:(f.x-f.anchorX)*scale,y:29-(f.feet-f.y)*scale});
  }resolve(true);
 }catch{frames.length=0;resolve(false);}};atlas.onerror=()=>resolve(false);atlas.src=new URL('../../assets/images/commander-phase1-reference-atlas.png',import.meta.url).href;
});
export function drawCommanderPhase1Sprite(c,e,time=0,{reduced=false,staticPose=false}={}){
 if(frames.length!==2||e.variant!=='commander'||e.hp/e.max<=.5||e.commander?.phase===2)return false;
 const state=e.commander||{},active=!!(state.volley||state.snipe||state.ricochet||state.rain),aim=state.volley?.aim??state.snipe?.aim??state.ricochet?.aim;
 let p=motion.get(e);if(!p){p={x:e.x,face:1};motion.set(e,p);}const dx=e.x-p.x;if(Math.abs(dx)>.1)p.face=Math.sign(dx);p.x=e.x;
 const face=active&&Number.isFinite(aim)?(Math.cos(aim)<0?-1:1):p.face,f=frames[active?1:0];
 c.save();c.translate(Math.round(e.x),Math.round(e.y));c.fillStyle='#07151a55';c.fillRect(-32,27,64,9);c.scale(face,1);c.imageSmoothingEnabled=false;const g=locomotion(e,time,{staticPose,reduced,blocked:state.transition>0||state.blinkFlash>0,stride:28});drawWalkingFrame(c,f,g,{feet:29,hip:12,weight:.85});
 if(state.transition>0||state.blinkFlash>0)drawSoftField(c,0,-7,58,'#9bdaf1',state.transition>0?.6:.35);c.restore();return true;
}
