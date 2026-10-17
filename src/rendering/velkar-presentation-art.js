import {velkarPresentationPose,velkarFacing} from './velkar-presentation-state.js';
import {drawFrostAura} from './frost-aura.js';
import {cleanDetachedCrop} from './sprite-crop.js';
const poses=new Map();
// Explicit original-pixel crops, foot anchors and standing scale. Kneeling
// bodies retain their scale; bow/horns never determine the body height.
const sheets=[
 {file:'velkar-presentation-poses-v1.png',width:1536,height:1024,frames:[
  ['1:arrival',0,0,512,495,280,480,380],['1:ready',512,0,540,495,742,480,380],
  ['1:light',1052,0,484,495,1290,480,360],['2:transition',0,495,520,529,290,970,410],
  ['2:death',520,495,515,529,790,970,410],['2:rest',1035,495,501,529,1300,970,410]
 ]},
 {file:'velkar-presentation-phases-v1.png',width:1024,height:1536,frames:[
  ['1:heavy',0,0,512,520,290,510,410],['2:light',512,0,512,520,780,510,410],
  ['2:heavy',0,520,550,520,280,1035,410],['2:recover',512,520,512,520,780,1035,410],
  ['1:death',0,1040,512,496,280,1475,410],['1:rest',512,1040,512,496,780,1475,410]
 ]}
];
export const velkarPresentationArtState=()=>({ready:poses.size===12,keys:[...poses.keys()].sort()});
export const velkarPresentationArtReady=typeof Image==='undefined'?Promise.resolve(false):Promise.all(sheets.map(s=>new Promise(resolve=>{
 const image=new Image();image.onload=()=>{try{
  if(image.naturalWidth!==s.width||image.naturalHeight!==s.height){resolve(false);return;}
  for(const [key,x,y,w,h,ax,feet,standing] of s.frames){
   const scale=75.6/standing,canvas=document.createElement('canvas');canvas.width=Math.ceil(w*scale);canvas.height=Math.ceil(h*scale);
   const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
   if(s.file==='velkar-presentation-phases-v1.png'&&['2:heavy','2:recover'].includes(key)){
    // Route the seam between the raised bow and the adjacent low cape.
    const path=key==='2:heavy'?[[0,0],[550,0],[550,350],[512,390],[512,h],[0,h]]:[[38,0],[w,0],[w,h],[0,h],[0,390],[38,350]];
    c.beginPath();path.forEach(([px,py],i)=>i?c.lineTo(px*scale,py*scale):c.moveTo(px*scale,py*scale));c.closePath();c.clip();
   }
   c.drawImage(image,x,y,w,h,0,0,w*scale,h*scale);cleanDetachedCrop(canvas);
   poses.set(key,{canvas,x:(x-ax)*scale,y:29-(feet-y)*scale});
  }resolve(true);
 }catch{resolve(false);}};image.onerror=()=>resolve(false);image.src=new URL('../../assets/images/'+s.file,import.meta.url).href;
}))).then(ok=>ok.every(Boolean));
export function drawVelkarPose(c,phase,pose,x,y,face=1){
 const f=poses.get(phase+':'+pose);if(!f)return false;
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(face<0?-1:1,1);c.imageSmoothingEnabled=false;c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y));c.restore();return true;
}
export function drawVelkarPresentation(c,e,time=0,options={}){
 const p=velkarPresentationPose(e,options);if(!p)return false;
 return drawVelkarPose(c,p.phase,p.pose,e.x,e.y,velkarFacing(e));
}
export function drawVelkarDeath(c,f,{reduced=false}={}){
 if(!f.commander||!poses.has(f.commanderPhase+':death')||!poses.has(f.commanderPhase+':rest'))return false;
 const age=Math.max(0,Math.min(1,1-f.t/f.duration)),alpha=Math.min(1,(1-age)*2),pose=reduced||age>.42?'rest':'death';
 c.save();c.beginPath();c.rect(25,45,910,455);c.clip();c.globalAlpha*=alpha;
 if(f.commanderPhase===2)drawFrostAura(c,{variant:'commander',hp:40,max:100,x:f.x,y:f.y,id:0,commander:{phase:2}},age,{reduced});
 drawVelkarPose(c,f.commanderPhase,pose,f.x,f.y,f.face);
 c.restore();return true;
}
