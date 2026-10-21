import {DeferredImage} from './asset-requests.js';
import {meleeProfiles} from '../combat/enemy-melee.js';
const frames=new Map();
export const enemyMeleeArtReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const image=new DeferredImage();image.onload=()=>{try{
  if(image.naturalWidth!==1536||image.naturalHeight!==1024){resolve(false);return;}
  const specs=[{key:'brute',y:0,feet:443,scale:67/331,xs:[0,512,1024,1536],anchors:[270,735,1280],foot:24},{key:'charger',y:512,feet:925,scale:52/402,xs:[0,500,1090,1536],anchors:[285,730,1320],foot:21}];
  for(const s of specs)frames.set(s.key,s.anchors.map((anchor,i)=>{
   const x=s.xs[i],w=s.xs[i+1]-x,c=document.createElement('canvas');c.width=Math.ceil(w*s.scale);c.height=Math.ceil(512*s.scale);const g=c.getContext('2d');g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(image,x,s.y,w,512,0,0,w*s.scale,512*s.scale);
   return {canvas:c,x:(x-anchor)*s.scale,y:s.foot-(s.feet-s.y)*s.scale};
  }));resolve(true);
 }catch{frames.clear();resolve(false);}};image.onerror=()=>resolve(false);image.src=new URL('../../assets/images/enemy-melee-poses-v1.png',import.meta.url).href;
});
export function drawEnemyMeleeSprite(c,e,fallbackFace=1){
 const a=e.meleeAttack,pair=frames.get(e.type);if(!a||!pair)return false;
 const f=pair[a.stage==='windup'?0:a.stage==='strike'?1:2],face=Number.isFinite(a.aim)?Math.cos(a.aim)<0?-1:1:fallbackFace;
 c.save();c.scale(face,1);c.imageSmoothingEnabled=false;c.drawImage(f.canvas,Math.round(f.x),Math.round(f.y));c.restore();return true;
}
export function drawEnemyMeleeGround(c,e,reduced=false){
 const a=e.meleeAttack,profile=meleeProfiles[e.type];if(!a||!profile||a.stage==='recover'||e.hp<=0)return;
 const radius=profile.radius*(e.scale??1),active=a.stage==='strike';
 c.save();c.translate(e.x,e.y);c.rotate(a.aim);c.strokeStyle=active?'#f3d29d':'#df9e79';c.lineWidth=active?3:1.5;c.globalAlpha=reduced?.65:active?.85:.55;c.setLineDash(active?[]:[4,4]);
 c.beginPath();c.moveTo(0,0);c.arc(0,0,radius,-profile.halfAngle,profile.halfAngle);c.closePath();c.stroke();
 if(active){const q=1-a.time/.12;c.setLineDash([]);c.strokeStyle='#fff0c3';c.beginPath();c.arc(0,0,radius*.82,-profile.halfAngle,profile.halfAngle*(reduced?1:2*q-1));c.stroke();}
 c.restore();
}
export function applyEnemyMeleePose(c,e,{reduced=false}={}){
 const a=e.meleeAttack;if(!a||['brute','charger'].includes(e.type)||reduced)return;
 const push=a.stage==='strike'?2:a.stage==='windup'?-1:0;c.translate(Math.cos(a.aim)*push,Math.sin(a.aim)*push);
}
