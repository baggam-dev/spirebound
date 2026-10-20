import {DeferredImage} from './asset-requests.js';
const frames=[],scale=.095;
export const spikeNestSpriteState=()=>({ready:frames.length===4});
export const spikeNestSpriteReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const atlas=new DeferredImage();atlas.onload=()=>{try{
  if(atlas.naturalWidth!==1254||atlas.naturalHeight!==1254){resolve(false);return;}
  for(const f of [
   {x:45,y:35,w:540,h:540,ax:320,feet:570},
   {x:660,y:65,w:545,h:515,ax:935,feet:570},
   {x:35,y:590,w:655,h:600,ax:365,feet:1180},
   {x:680,y:660,w:530,h:530,ax:950,feet:1180}
  ]){
   const canvas=document.createElement('canvas');canvas.width=Math.ceil(f.w*scale);canvas.height=Math.ceil(f.h*scale);
   const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(atlas,f.x,f.y,f.w,f.h,0,0,f.w*scale,f.h*scale);
   frames.push({canvas,x:(f.x-f.ax)*scale,y:21-(f.feet-f.y)*scale});
  }resolve(true);
 }catch{frames.length=0;resolve(false);}};atlas.onerror=()=>resolve(false);atlas.src=new URL('../../assets/images/spike-nest-reference-atlas.png',import.meta.url).href;
});
export function drawSpikeNestSprite(c,e,staticPose=false){
 if(e.type!=='spikeNest'||frames.length!==4)return false;
 const index=staticPose?0:e.attackPhase==='warning'?1:e.attackPhase==='recover'?(e.attackTime>.4?2:3):0,f=frames[index];
 c.save();c.translate(Math.round(e.x),Math.round(e.y));c.imageSmoothingEnabled=false;c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y));
 if(!staticPose&&e.escapeDepth){c.strokeStyle='#e69caf';c.lineWidth=1.5;c.beginPath();c.moveTo(-17,13);c.lineTo(-22,17);c.moveTo(17,13);c.lineTo(22,17);c.stroke();}
 c.restore();return true;
}

// Uses saved combat phase/time directly: no actor mutation or extra damage.
export function drawSpikeNestAttack(c,e,reduced=false){
 if(e.type!=='spikeNest'||!Number.isFinite(e.targetX)||!Number.isFinite(e.targetY))return;
 if(e.attackPhase!=='warning'&&e.attackPhase!=='recover')return;
 const warning=e.attackPhase==='warning',progress=warning?Math.max(0,Math.min(1,1-e.attackTime/.9)):Math.max(0,Math.min(1,1-e.attackTime/.55));
 c.save();c.translate(e.targetX,e.targetY);c.strokeStyle='#d994b5';c.lineWidth=1.5;
 if(warning){
  c.globalAlpha=.4;c.beginPath();c.arc(0,0,36,0,Math.PI*2);c.stroke();
  c.globalAlpha=.7;c.beginPath();c.arc(0,0,36,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);c.stroke();
  c.fillStyle='#ddb9c5';c.fillRect(-2,-7,4,14);c.fillRect(-7,-2,14,4);
 }else{
  const lift=reduced?1:Math.min(1,progress/.12)*Math.max(0,(1-progress)/.6);
  c.globalAlpha=Math.max(0,1-progress);c.beginPath();c.arc(0,0,34,0,Math.PI*2);c.stroke();
  for(const [x,y,h] of [[-21,4,18],[16,7,23],[0,0,35],[-8,18,17],[10,-12,20]]){
   c.fillStyle='#3d263f';c.beginPath();c.moveTo(x-5,y+3);c.lineTo(x+2,y-h*lift);c.lineTo(x+6,y+3);c.closePath();c.fill();
   c.strokeStyle='#c3a8ad';c.lineWidth=2;c.beginPath();c.moveTo(x+2,y-h*lift);c.lineTo(x+5,y);c.stroke();
  }
 }
 c.restore();
}
