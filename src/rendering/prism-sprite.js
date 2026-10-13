import {characterSizes} from './character-sizes.js';
const frames=[];
export const prismSpriteState=()=>({ready:frames.length===2});
export const prismSpriteReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const atlas=new Image();atlas.onload=()=>{try{
  if(atlas.naturalWidth!==1774||atlas.naturalHeight!==887){resolve(false);return;}
  const scale=characterSizes.warden/675;
  for(const f of [{x:75,y:0,w:775,h:887,anchorX:475},{x:880,y:0,w:870,h:887,anchorX:1320}]){
   const canvas=document.createElement('canvas');canvas.width=Math.ceil(f.w*scale);canvas.height=Math.ceil(f.h*scale);const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(atlas,f.x,f.y,f.w,f.h,0,0,f.w*scale,f.h*scale);frames.push({canvas,x:(f.x-f.anchorX)*scale,y:-12-350*scale});
  }resolve(true);
 }catch{frames.length=0;resolve(false);}};atlas.onerror=()=>resolve(false);atlas.src=new URL('../../assets/images/prism-reference-atlas.png',import.meta.url).href;
});
export function drawPrismSprite(c,e,time){
 if(frames.length!==2)return false;
 const charged=['warning','beam','salvo'].includes(e.prismPhase),f=frames[charged?1:0];
 const bob=e.frozen>0?0:Math.sin(time*2.4+(e.id||0)*.7)*2;
 c.save();c.translate(0,bob);c.imageSmoothingEnabled=false;c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y));
 if(e.escapeDepth){c.strokeStyle='#e394b7';c.lineWidth=2;c.beginPath();c.moveTo(-24,-15);c.lineTo(-30,-20);c.moveTo(24,-15);c.lineTo(30,-20);c.stroke();}c.restore();return true;
}
