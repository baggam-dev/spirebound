import {DeferredImage} from './asset-requests.js';
const frames=[],motion=new WeakMap();
export const demonBatSpriteState=()=>({ready:frames.length===4});
export const demonBatSpriteReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const image=new DeferredImage();image.onload=()=>{try{
  if(image.naturalWidth!==1254||image.naturalHeight!==1254){resolve(false);return;}
  const cell=627,scale=.07,pivots=[[.57,.59],[.55,.58],[.56,.54],[.62,.55]];
  for(let i=0;i<4;i++){
   const canvas=document.createElement('canvas');canvas.width=canvas.height=Math.ceil(cell*scale);const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(image,i%2*cell,Math.floor(i/2)*cell,cell,cell,0,0,cell*scale,cell*scale);
   frames.push({canvas,x:-cell*pivots[i][0]*scale,y:-cell*pivots[i][1]*scale-8});
  }resolve(true);
 }catch{frames.length=0;resolve(false);}};image.onerror=()=>resolve(false);image.src=new URL('../../assets/images/demon-bat-compact-v1.png',import.meta.url).href;
});
export function drawDemonBatSprite(c,e,time=0,reduced=false,staticPose=false){
 if(e.type!=='demonBat'||frames.length!==4)return false;
 let face=1;
 if(!staticPose){let p=motion.get(e);if(!p){p={x:e.x,face:1};motion.set(e,p);}if(Math.abs(e.x-p.x)>.1)p.face=Math.sign(e.x-p.x);p.x=e.x;face=e.attackPhase&&Number.isFinite(e.aim)?(Math.cos(e.aim)<0?-1:1):p.face;}
 const index=staticPose?0:e.attackPhase==='dash'?3:e.attackPhase==='warning'?2:reduced||e.frozen>0?0:Math.floor(time*10+(e.id||0))%2;
 const f=frames[index],bob=staticPose||reduced||e.frozen>0||e.attackPhase?0:Math.sin(time*10+(e.id||0));
 c.save();try{c.translate(Math.round(e.x),Math.round(e.y));if(!staticPose){c.fillStyle='#0005';c.fillRect(-9,12,18,3);}c.translate(0,bob);c.scale(face,1);c.imageSmoothingEnabled=false;c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y));}finally{c.restore();}return true;
}
