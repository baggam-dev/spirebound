import {DeferredImage} from './asset-requests.js';
import {characterSizes} from './character-sizes.js';
const frames=[],motion=new WeakMap(),scale=characterSizes.grunt/460;
export const demonSoldierSpriteState=()=>({ready:frames.length===6});
export const demonSoldierSpriteReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const atlas=new DeferredImage();atlas.onload=()=>{try{
  if(atlas.naturalWidth!==1536||atlas.naturalHeight!==1024){resolve(false);return;}
  for(const f of [
   {x:85,y:15,w:390,h:485,ax:275,feet:485},
   {x:590,y:15,w:375,h:485,ax:780,feet:485},
   {x:1080,y:15,w:395,h:485,ax:1280,feet:485},
   {x:65,y:515,w:465,h:480,ax:285,feet:985},
   {x:530,y:535,w:610,h:460,ax:755,feet:985,clip:[[590,535],[1140,535],[1140,995],[530,995],[530,900],[590,800]]},
   {x:1095,y:525,w:390,h:480,ax:1290,feet:995,clip:[[1160,525],[1485,525],[1485,1005],[1095,1005],[1095,820],[1160,730]]}
  ]){
   const canvas=document.createElement('canvas');canvas.width=Math.ceil(f.w*scale);canvas.height=Math.ceil(f.h*scale);
   const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   if(f.clip){ctx.beginPath();f.clip.forEach(([x,y],i)=>i?ctx.lineTo((x-f.x)*scale,(y-f.y)*scale):ctx.moveTo((x-f.x)*scale,(y-f.y)*scale));ctx.closePath();ctx.clip();}
   ctx.drawImage(atlas,f.x,f.y,f.w,f.h,0,0,f.w*scale,f.h*scale);frames.push({canvas,x:(f.x-f.ax)*scale,y:21-(f.feet-f.y)*scale});
  }resolve(true);
 }catch{frames.length=0;resolve(false);}};atlas.onerror=()=>resolve(false);atlas.src=new URL('../../assets/images/demon-soldier-reference-atlas.png',import.meta.url).href;
});
export function drawDemonSoldierSprite(c,e,time=0,reduced=false,staticPose=false){
 if(e.type!=='demonSoldier'||frames.length!==6)return false;
 let face=1,index=0;
 if(!staticPose){
  let p=motion.get(e);if(!p){p={x:e.x,y:e.y,step:0,face:1};motion.set(e,p);}
  const dx=e.x-p.x,dy=e.y-p.y,moved=Math.hypot(dx,dy);p.x=e.x;p.y=e.y;
  if(Math.abs(dx)>.1)p.face=Math.sign(dx);
  if(moved<40&&!(e.frozen>0))p.step+=moved;
  face=e.attackPhase&&Number.isFinite(e.aim)?(Math.cos(e.aim)<0?-1:1):p.face;
  index=e.attackPhase==='warning'?3:e.attackPhase==='recover'?(e.attackTime>.5?4:5):moved>.05&&!reduced?(1+Math.floor(p.step/10)%2):0;
 }
 const f=frames[index];c.save();c.translate(Math.round(e.x),Math.round(e.y));c.scale(face,1);c.imageSmoothingEnabled=false;c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y));
 if(!staticPose&&e.escapeDepth){c.strokeStyle='#e49ca1';c.lineWidth=1.5;c.beginPath();c.moveTo(-16,10);c.lineTo(-20,15);c.moveTo(16,10);c.lineTo(20,15);c.stroke();}
 c.restore();return true;
}
export function drawDemonSoldierAttack(c,e,reduced=false){
 if(e.type!=='demonSoldier'||!Number.isFinite(e.aim))return;
 const warning=e.attackPhase==='warning',strike=e.attackPhase==='recover'&&e.attackTime>.5;
 if(!warning&&!strike)return;
 c.save();c.translate(e.x,e.y);c.rotate(e.aim);c.strokeStyle=warning?'#d0a3b4':'#e1c5d1';c.lineWidth=warning?1:2;c.globalAlpha=warning?.5:reduced?.35:Math.max(0,(e.attackTime-.5)/.15)*.65;
 c.beginPath();c.arc(0,0,72,-1.05,1.05);c.stroke();
 if(warning){for(const side of [-1,1]){c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(1.05)*72,side*Math.sin(1.05)*72);c.stroke();}}
 c.restore();
}
