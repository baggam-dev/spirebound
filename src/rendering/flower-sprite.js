import {characterSizes} from './character-sizes.js';
import {ordinaryPose} from './ordinary-presentation-state.js';
const frames=[];
export const flowerSpriteState=()=>({ready:frames.length===2});
export const flowerSpriteReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const atlas=new Image();atlas.onload=()=>{try{
  if(atlas.naturalWidth!==1774||atlas.naturalHeight!==887){resolve(false);return;}
  const scale=characterSizes.grunt/615;
  const crop=(x,y,w,h,anchorX)=>{const canvas=document.createElement('canvas');canvas.width=Math.ceil(w*scale);canvas.height=Math.ceil(h*scale);const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(atlas,x,y,w,h,0,0,w*scale,h*scale);return {canvas,x:(x-anchorX)*scale,y:21-(810-y)*scale};};
  frames.push({top:crop(120,180,710,485,465),root:crop(120,650,710,185,465)}, {top:crop(995,115,715,550,1350)});resolve(true);
 }catch{resolve(false);}};atlas.onerror=()=>resolve(false);atlas.src=new URL('../../assets/images/flower-reference-atlas.png',import.meta.url).href;
});
export function drawFlowerSprite(c,e,time,room,options={}){
 if(frames.length!==2)return false;
 const preparing=(room?.hazards||[]).some(h=>h.owner===e.id&&['warning','flight'].includes(h.phase));
 const phase=time*Math.PI*2/1.8+(e.id||0)*1.73,pulse=e.frozen>0?0:Math.sin(phase),top=frames[preparing?1:0].top,hinge=21-160*characterSizes.grunt/615;
 const reaction=ordinaryPose(options.actor||e,options),amount=reaction?(reaction.kind==='arrival'?.04*(1-reaction.progress):Math.sin(Math.PI*reaction.progress)*(reaction.heavy?.045:.025)):0;
 c.save();c.translate(0,hinge);c.rotate(pulse*.025);c.scale((1+pulse*.012)*(1+amount*.5),(1-pulse*.018)*(1-amount));c.imageSmoothingEnabled=false;c.drawImage(top.canvas,top.x,top.y-hinge);c.restore();
 // The exact idle root image stays still in both states, covering the flexible seam.
 const root=frames[0].root;c.drawImage(root.canvas,root.x,root.y);
 if(e.escapeDepth){c.strokeStyle='#d48591';c.lineWidth=1.5;c.beginPath();c.moveTo(-18,12);c.lineTo(-23,8);c.moveTo(18,12);c.lineTo(23,8);c.stroke();}
 return true;
}
