import {CORE_MOTION} from '../combat/demon-core-motion.js';
import {DEMON_EYE,DEMON_TONGUE,demonEyeOffsets,demonRayLength} from '../combat/demon-attack-shapes.js';
import {strokeThreat} from './threat-contours.js';
function tongueSector(c,a,obstacles){
 c.beginPath();c.moveTo(a.x,a.y);
 for(let i=0;i<=24;i++){const angle=a.aim-DEMON_TONGUE.halfAngle+2*DEMON_TONGUE.halfAngle*i/24,r=demonRayLength(a,angle,obstacles,DEMON_TONGUE.radius);c.lineTo(a.x+Math.cos(angle)*r,a.y+Math.sin(angle)*r);}
 c.closePath();
}
export function drawDemonTongueWarning(c,a,obstacles=[],{outlineOnly=false,active=false}={}){
 c.save();tongueSector(c,a,obstacles);if(!outlineOnly){c.fillStyle='#d399bc15';c.fill();}c.strokeStyle='#e7afd0';c.lineWidth=1.2;c.setLineDash(active?[]:[5,4]);strokeThreat(c);c.restore();
}
export function drawDemonCoreAttackEffects(c,d,obstacles=[],reduced=false){
 const f=d.coreFlash;if(!f)return;
 const striking=f.time>CORE_MOTION.recover;
 c.save();
 if(f.kind==='eyeRay'&&striking){
  c.globalAlpha*=reduced?.45:.7;c.lineCap='butt';
  for(const offset of demonEyeOffsets(d.pressureVersion===1)){
   const angle=f.aim+offset,length=demonRayLength(f,angle,obstacles,1200,2);if(!(length>0))continue;
   c.strokeStyle='#ce9add';c.lineWidth=DEMON_EYE.halfWidth*2;c.beginPath();c.moveTo(f.x,f.y);c.lineTo(f.x+Math.cos(angle)*length,f.y+Math.sin(angle)*length);c.stroke();
   c.strokeStyle='#f7e4fa';c.lineWidth=reduced?2:4;c.stroke();
  }
 }else if(f.kind==='mouthTongue'){
  const retract=striking?1:Math.max(0,Math.min(1,f.time/CORE_MOTION.recover)),length=demonRayLength(f,f.aim,obstacles,DEMON_TONGUE.radius)*retract;
  if(striking){tongueSector(c,f,obstacles);c.fillStyle='#d591bc45';c.fill();}
  if(length>0){c.translate(f.x,f.y);c.rotate(f.aim);c.strokeStyle='#945074';c.lineWidth=reduced?5:8;c.lineCap='round';c.beginPath();c.moveTo(0,0);c.lineTo(length,0);c.stroke();c.strokeStyle='#efb1c8';c.lineWidth=2;c.stroke();}
 }
 c.restore();
}
