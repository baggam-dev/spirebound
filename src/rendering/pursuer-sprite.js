import {DeferredImage} from './asset-requests.js';
import {PURSUER} from '../combat/pursuer.js';
import {drawSlashRibbon} from './arrow-impact-visuals.js';
let loadError=null;
const frames=[],motion=new WeakMap(),scale=PURSUER.height/261;
const boxes=[[46,52,333,313],[37,52,338,313],[38,72,338,313],[46,53,334,314],[48,48,337,304],[14,64,327,303],[4,67,350,302],[7,63,365,302],[15,43,379,302],[22,22,287,305],[6,89,351,304],[11,159,365,310]];
export const pursuerSpriteState=()=>({ready:frames.length===12,frames:frames.length,height:PURSUER.height,error:loadError});
export const pursuerSpriteReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const atlas=new DeferredImage();atlas.onload=()=>{try{
  if(atlas.naturalWidth!==1536||atlas.naturalHeight!==1024){loadError='Unexpected atlas dimensions';resolve(false);return;}
  for(let i=0;i<boxes.length;i++){
   const row=Math.floor(i/4),col=i%4,[x,y,right,bottom]=boxes[i],w=right-x,h=bottom-y,top=[0,341,683][row],feet=[313,304,310][row];
   const canvas=document.createElement('canvas');canvas.width=Math.ceil(w*scale);canvas.height=Math.ceil(h*scale);const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(atlas,col*384+x,top+y,w,h,0,0,w*scale,h*scale);
   frames.push({canvas,x:(x-176)*scale,y:15-(feet-y)*scale});
  }resolve(true);
 }catch(error){loadError=String(error);frames.length=0;resolve(false);}};atlas.onerror=()=>{loadError='Atlas request failed';resolve(false);};atlas.src=new URL('../../assets/images/pursuer-atlas-v1.png',import.meta.url).href;
});
export function pursuerPose(e,{distance=0,moving=false,time=0,staticPose=false}={}){
 const face=Math.cos(e.attackPhase?(e.aim??0):(e.facing??e.aim??0))<0?-1:1;
 if(staticPose)return {index:0,face};
 if(e.hp<=0)return {index:11,face};
 if(e.attackPhase==='warning'||e.attackPhase==='cleaveWarning')return {index:5,face};
 if(e.attackPhase==='dash')return {index:e.attackTime>.25?6:7,face};
 if(e.attackPhase==='cleave')return {index:8,face};
 if(e.attackPhase==='recover')return {index:9,face};
 return {index:moving?1+Math.floor(distance/12)%4:0,face};
}
function frame(c,index,x,y,face=1,alpha=1){const f=frames[index];if(!f)return false;c.save();c.translate(Math.round(x),Math.round(y));c.scale(face,1);c.globalAlpha*=alpha;c.imageSmoothingEnabled=false;c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y));c.restore();return true;}
export function drawPursuerSprite(c,e,time=0,reduced=false,staticPose=false){
 if(e.type!=='pursuer')return false;if(frames.length!==12)return true; // Required asset gate owns retry; never show another actor as a substitute.
 let state=motion.get(e);if(!state){state={x:e.x,y:e.y,distance:0,movedAt:-1};motion.set(e,state);}
 const delta=Math.hypot(e.x-state.x,e.y-state.y);if(delta>0&&delta<50){state.distance+=delta;state.movedAt=time;}state.x=e.x;state.y=e.y;
 const pose=pursuerPose(e,{distance:state.distance,moving:time-state.movedAt<.12,time,staticPose});
 c.save();c.fillStyle='#11192355';c.beginPath();c.ellipse(e.x,e.y+15,26,8,0,0,Math.PI*2);c.fill();c.restore();frame(c,pose.index,e.x,e.y,pose.face);
 if(!staticPose&&e.attackPhase==='cleave'){c.save();c.translate(e.x,e.y);c.rotate(e.aim);drawSlashRibbon(c,PURSUER.reach,1-e.attackTime/PURSUER.cleave,{start:-PURSUER.halfAngle,end:PURSUER.halfAngle,color:'#c8b6de',reduced,heavy:true});c.restore();}
 return true;
}
export function drawPursuerDeath(c,f,{reduced=false}={}){
 if(f.bodyType!=='pursuer')return false;const age=1-f.t/f.duration;
 frame(c,reduced||age>.45?11:10,f.x,f.y,f.face||1,Math.min(1,Math.max(0,1-age)*2));return true;
}
export function drawPursuerWarning(c,e,reduced=false){
 if(e.type!=='pursuer'||e.hp<=0)return;c.save();c.beginPath();c.rect(25,45,910,455);c.clip();c.lineWidth=2;c.strokeStyle='#edb4b5';c.fillStyle='#ce74751f';c.setLineDash([]);
 if(e.attackPhase==='warning'||e.attackPhase==='dash'){
  const x=e.x,y=e.y,a=e.aim,r=PURSUER.radius,length=PURSUER.distance*(e.attackPhase==='dash'?e.attackTime/PURSUER.dash:1),toX=x+Math.cos(a)*length,toY=y+Math.sin(a)*length;c.beginPath();for(const sign of [-1,1]){c.moveTo(x-Math.sin(a)*r*sign,y+Math.cos(a)*r*sign);c.lineTo(toX-Math.sin(a)*r*sign,toY+Math.cos(a)*r*sign);}c.stroke();
  c.beginPath();c.moveTo(toX-Math.sin(a)*r,toY+Math.cos(a)*r);c.lineTo(toX+Math.sin(a)*r,toY-Math.cos(a)*r);c.stroke();
 }else if(e.attackPhase==='cleaveWarning'||e.attackPhase==='cleave'){
  c.beginPath();c.moveTo(e.x,e.y);c.arc(e.x,e.y,PURSUER.reach,e.aim-PURSUER.halfAngle,e.aim+PURSUER.halfAngle);c.closePath();if(!reduced)c.fill();c.stroke();c.font='bold 13px Galmuri, monospace';c.textAlign='center';c.fillStyle='#ffe0b3';c.fillText('!! 2♥',e.x+Math.cos(e.aim)*60,e.y+Math.sin(e.aim)*60-8);
 }else if(e.attackPhase==='recover'){c.font='11px Galmuri, monospace';c.textAlign='center';c.fillStyle='#c0dcb9';c.fillText('빈틈!',e.x,Math.max(63,e.y-81));}
 c.restore();
}
