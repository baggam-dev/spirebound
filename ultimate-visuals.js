import {CROSSBOW} from './combat-tuning.js';
const clamp=n=>Math.max(0,Math.min(1,n));
const box=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
function line(c,points,color,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(Math.round(x),Math.round(y)):c.moveTo(Math.round(x),Math.round(y)));c.stroke();}
function clipArena(c){c.beginPath();c.rect(25,45,910,455);c.clip();}
export function rainVisualState(z){
 const pulse=Math.max(0,Math.min(2,z.pulses-1)),age=Math.max(0,z.elapsed-pulse*.6);
 return {pulse,impact:z.pulses>0?clamp(1-age/.28):0,fall:z.pulses<3?clamp((z.elapsed-(z.pulses*.6-.3))/.3):0,opacity:clamp((1.8-z.elapsed)/.3)};
}
export function turretVisualState(t){
 return {build:clamp((CROSSBOW.lifetime-t.time)/.28),recoil:clamp(1-(CROSSBOW.interval-t.clock)/.14),opacity:clamp(t.time/1.2),remaining:clamp(t.time/CROSSBOW.lifetime)};
}
// Ground markings stay below hostile warnings and actors.
export function drawUltimateGround(c,room){const z=room.arrowRain;if(!z)return;const v=rainVisualState(z);c.save();clipArena(c);c.globalAlpha=v.opacity;
 c.beginPath();c.arc(z.x,z.y,z.r,0,Math.PI*2);c.fillStyle='#83c5d60c';c.fill();c.strokeStyle='#a5d8dc80';c.lineWidth=1;c.setLineDash([6,7]);c.stroke();c.setLineDash([]);
 for(let i=0;i<8;i++){const a=i*Math.PI/4,x=z.x+Math.cos(a)*(z.r-6),y=z.y+Math.sin(a)*(z.r-6);box(c,x-2,y-2,4,4,'#afdedba0');}
 c.restore();}
export function drawArrowRain(c,z){const v=rainVisualState(z);c.save();clipArena(c);c.beginPath();c.arc(z.x,z.y,z.r,0,Math.PI*2);c.clip();c.globalAlpha=v.opacity;
 // Every arrow lands on the actual 0 / .6 / 1.2-second damage pulse.
 // The first pulse is immediate: never delay damage to fit an anticipation.
 for(let i=0;i<24;i++){
  const angle=i*2.3999632297,r=z.r*Math.sqrt((i+.5)/24)*.95,x=z.x+Math.cos(angle)*r,y=z.y+Math.sin(angle)*r;
  if(v.impact>0){const spread=(1-v.impact)*13;c.globalAlpha=v.opacity*v.impact;
   line(c,[[x-4,y-18],[x,y]],'#d7eef0',2);box(c,x-3,y-3,7,3,'#f5e7b5');
   for(let j=0;j<3;j++){const a=j*Math.PI*2/3+i;box(c,x+Math.cos(a)*spread,y+Math.sin(a)*spread*.5,3,2,j===0?'#f8e1a1':'#89c3c7');}
  }
  if(v.fall>0){c.globalAlpha=v.opacity*.8;const lift=(1-v.fall)*105,ax=x-lift*.22,ay=y-lift;
   line(c,[[ax-6,ay-28],[ax,ay]],'#8fc6d955',4);line(c,[[ax-5,ay-22],[ax,ay]],'#d6e9e9',2);
   line(c,[[ax-4,ay-4],[ax,ay],[ax+2,ay-6]],'#f6dfac',2);box(c,ax-7,ay-21,5,3,'#78a6ad');
  }
 }
 c.restore();}
export function drawCrossbow(c,t){const v=turretVisualState(t);if(t.time<=0)return;c.save();clipArena(c);c.translate(Math.round(t.x),Math.round(t.y));c.globalAlpha=v.opacity;
 // Feet deploy outward; the mechanism can still fire immediately as before.
 box(c,-20,12,40,7,'#0c151c88');
 for(const side of [-1,1]){const x=side*(7+v.build*9);line(c,[[0,3],[x,14]],'#202730',7);line(c,[[0,3],[x,14]],'#8b7858',3);box(c,x-4,13,8,4,'#b39a6d');}
 box(c,-9,0,18,12,'#3c3934');box(c,-8,0,16,3,'#d5bb80');box(c,-3,-4,6,11,'#a68b5d');
 if(v.build<1){c.globalAlpha=v.opacity*(1-v.build);for(let i=0;i<6;i++){const a=i*Math.PI/3;box(c,Math.cos(a)*(14+v.build*15),14+Math.sin(a)*5,3,2,'#d8c690');}c.globalAlpha=v.opacity;}
 c.save();c.translate(0,-3-(1-v.build)*8);c.rotate(t.aim||0);c.translate(-v.recoil*5,0);
 line(c,[[-7,-19],[5,-13],[10,0],[5,13],[-7,19]],'#18222c',7);
 line(c,[[-7,-19],[5,-13],[10,0],[5,13],[-7,19]],'#bba16c',4);
 line(c,[[-7,-19],[-7-v.recoil*5,0],[-7,19]],'#eee0b5',1);
 box(c,-16,-5,39,10,'#222b31');box(c,-14,-4,34,3,'#d8c492');box(c,-11,2,28,2,'#8f7853');box(c,-5,-8,6,16,'#a18556');box(c,-3,-3,3,5,'#f0dda0');
 box(c,12,-2,16,4,'#dbe2d4');box(c,-16,-3,4,6,'#6b5541');for(const side of [-1,1])box(c,-8,side*16-2,4,4,'#e7ca82');
 if(v.recoil>.35){c.globalAlpha=v.opacity*v.recoil;line(c,[[27,0],[36,0]],'#fff0bb',2);line(c,[[28,-2],[32,-6]],'#d7c493',1);line(c,[[28,2],[32,6]],'#d7c493',1);}
 c.restore();c.globalAlpha=v.opacity*.8;box(c,-17,23,34,2,'#17212b');box(c,-17,23,Math.ceil(34*v.remaining),2,'#d5b97a');c.restore();}
