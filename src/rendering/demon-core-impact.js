import {CORE_MOTION} from '../combat/demon-core-motion.js';
// Cosmetic only: the contact radius remains the existing 95px stomp damage radius.
export function drawDemonCoreImpact(c,d,reduced=false){
 const f=d.coreFlash;if(!f||f.kind!=='footJump')return;
 const t=Math.max(0,Math.min(1,(CORE_MOTION.duration-f.time)/CORE_MOTION.duration));
 c.save();c.translate(f.tx,f.ty);c.globalAlpha*=1-t;c.strokeStyle='#d9b4d0';c.lineWidth=2;c.beginPath();c.arc(0,0,reduced?95:82+t*13,0,Math.PI*2);c.stroke();
 if(!reduced){c.strokeStyle='#977c9b';c.lineWidth=1;c.beginPath();c.arc(0,0,64+t*24,0,Math.PI*2);c.stroke();for(let i=0;i<6;i++){const a=i*Math.PI/3,x=Math.cos(a)*(45+t*36),y=Math.sin(a)*(45+t*36);c.fillStyle='#bba6bc';c.fillRect(x-1,y-1,2,2);}}
 c.restore();
}
