import {mordoPresentationPose} from './mordo-presentation-state.js';
import {drawKingAura} from './king-aura.js';
const poses=new Map();
// x,y,width,height,feet-anchor-x,feet-y,standing-body-height. Crouched poses
// retain the standing scale instead of being stretched back to full height.
const sheets=[
 {file:'mordo-presentation-poses-v2.png',width:1536,height:1024,frames:[
  ['1:arrival',0,0,460,550,270,535,390],['1:awaken',460,0,565,550,720,535,390],
  ['1:light',1025,0,511,550,1230,535,390],['1:heavy',0,550,540,474,270,950,390],
  ['3:death',540,550,540,474,785,970,390],['3:rest',1080,550,456,474,1250,970,390]
 ]},
 {file:'mordo-presentation-phases-v1.png',width:1024,height:1536,frames:[
  ['2:light',0,0,545,390,270,372,350],['2:heavy',500,0,524,390,720,372,350],
  ['3:light',0,390,545,390,270,755,350],['3:heavy',500,390,524,390,720,755,350],
  ['1:death',0,780,530,355,270,1098,350],['1:rest',530,780,494,355,745,1108,350],
  ['2:death',0,1135,535,401,270,1450,350],['2:rest',535,1135,489,401,750,1472,350]
 ]}
];
export const mordoPresentationArtState=()=>({ready:poses.size===14,keys:[...poses.keys()].sort()});
export const mordoPresentationArtReady=typeof Image==='undefined'?Promise.resolve(false):Promise.all(sheets.map(s=>new Promise(resolve=>{
 const image=new Image();image.onload=()=>{try{
  if(image.naturalWidth!==s.width||image.naturalHeight!==s.height){resolve(false);return;}
  for(const [key,x,y,w,h,ax,feet,standing] of s.frames){
   const scale=92.4/standing,canvas=document.createElement('canvas');canvas.width=Math.ceil(w*scale);canvas.height=Math.ceil(h*scale);
   const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
   // The light-hit halberd enters the adjoining cell above its cape; keep the
   // diagonal seam in transparent space instead of including the other pose.
   if(s.file==='mordo-presentation-phases-v1.png'&&(key.endsWith(':light')||key.endsWith(':heavy'))){
    const path=key.endsWith(':light')?[[0,0],[w,0],[w,245],[490,245],[490,h],[0,h]]:[[45,0],[w,0],[w,h],[0,h],[0,245],[45,245]];
    c.beginPath();path.forEach(([px,py],i)=>i?c.lineTo(px*scale,py*scale):c.moveTo(px*scale,py*scale));c.closePath();c.clip();
   }
   c.drawImage(image,x,y,w,h,0,0,w*scale,h*scale);
   poses.set(key,{canvas,x:(x-ax)*scale,y:21-(feet-y)*scale});
  }resolve(true);
 }catch{resolve(false);}};image.onerror=()=>resolve(false);image.src=new URL('../../assets/images/'+s.file,import.meta.url).href;
}))).then(ok=>ok.every(Boolean));
export function drawMordoPose(c,phase,pose,x,y,face=1,alpha=1){
 const f=poses.get(phase+':'+pose);if(!f)return false;
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(face<0?-1:1,1);c.globalAlpha*=alpha;c.imageSmoothingEnabled=false;c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y));c.restore();return true;
}
export function drawMordoPresentation(c,e,time=0,options={}){
 if(e.variant!=='king')return false;const p=mordoPresentationPose(e,options);if(!p)return false;
 return drawMordoPose(c,p.phase,p.pose,e.x,e.y,Number.isFinite(e.facing)&&Math.cos(e.facing)<0?-1:1);
}
export function drawMordoDeath(c,f,{reduced=false}={}){
 if(!f.king||!poses.has(f.kingPhase+':death')||!poses.has(f.kingPhase+':rest'))return false;
 const age=Math.max(0,Math.min(1,1-f.t/f.duration)),alpha=Math.min(1,(1-age)*2.1),pose=reduced||age>.42?'rest':'death';
 c.save();c.beginPath();c.rect(25,45,910,455);c.clip();
 // Fade the entire snapshot, including its detached aura, without a new actor.
 c.globalAlpha*=alpha;
 if(f.kingPhase>=2)drawKingAura(c,{variant:'king',hp:f.kingPhase===2?50:20,max:100,x:f.x,y:f.y,id:0},age*.8,{reduced});
 drawMordoPose(c,f.kingPhase,pose,f.x,f.y,f.face);
 if(!reduced)for(let i=0;i<9;i++){const t=(age+i/12)%1;c.globalAlpha=alpha*(1-t)*.55;c.fillStyle=i%2?'#c9b0dc':'#d7bd8e';c.fillRect(Math.round(f.x+Math.sin(i*2.3)*22),Math.round(f.y-20-t*70),2,2);}
 c.restore();return true;
}
