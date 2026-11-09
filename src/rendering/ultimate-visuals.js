import {drawCrossbowArt} from './crossbow-art.js';
import {drawImpactAccent} from './arrow-impact-visuals.js';
import {CROSSBOW} from '../combat/combat-tuning.js';
const clamp=n=>Math.max(0,Math.min(1,n));
const box=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
function line(c,points,color,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(Math.round(x),Math.round(y)):c.moveTo(Math.round(x),Math.round(y)));c.stroke();}
function clipArena(c){c.beginPath();c.rect(25,45,910,455);c.clip();}
export function rainVisualState(z){
 const pulse=Math.max(0,Math.min(5,z.pulses-1)),age=Math.max(0,z.elapsed-pulse*.3);
 return {pulse,impact:z.pulses>0?clamp(1-age/.28):0,fall:z.pulses<6?clamp((z.elapsed-(z.pulses*.3-.18))/.18):0,opacity:clamp((1.8-z.elapsed)/.3)};
}
export function turretVisualState(t){
 return {build:clamp((CROSSBOW.lifetime-t.time)/.28),recoil:clamp(1-(CROSSBOW.interval-t.clock)/.14),opacity:clamp(t.time/1.2),remaining:clamp(t.time/CROSSBOW.lifetime)};
}
// Ground markings stay below hostile warnings and actors.
export function drawUltimateGround(c,room){} // No circular floor marker.
export function drawArrowRain(c,z,reduced=false){
 if(z.elapsed<0||z.elapsed>=1.8)return;
 const v=rainVisualState(z),age=Math.max(0,z.elapsed-v.pulse*.3);c.save();clipArena(c);c.beginPath();c.arc(z.x,z.y,z.r,0,Math.PI*2);c.clip();const alpha=c.globalAlpha;
 // Six real pulses: 0 / .3 / .6 / .9 / 1.2 / 1.5. Initial damage stays immediate.
 const count=reduced?12:24;
 for(let j=0;j<count;j++){
  const i=reduced?j*2:j,a=i*2.3999632297,r=z.r*Math.sqrt((i+.5)/24)*.95,x=z.x+Math.cos(a)*r,y=z.y+Math.sin(a)*r,major=i%4===0,scale=major?1.45:.8;
  if(z.pulses>0&&age<.26){const fade=1-age/.26,spread=6+age*(major?75:45);c.globalAlpha=alpha*v.opacity*fade*.7;
   for(let k=0;k<(reduced?2:4);k++){const angle=k*2.4+i;box(c,x+Math.cos(angle)*spread,y+Math.sin(angle)*spread*.35,major?4:2,2,k%2?'#9d8871':'#d6c4a4');}
   if(major){c.globalAlpha=alpha*v.opacity;drawImpactAccent(c,{x,y,age,strength:2,reduced,duration:.2});}
   else if(age<.045){c.globalAlpha=alpha*v.opacity*(1-age/.045);box(c,x-5,y-1,10,2,'#fff0c7');box(c,x-1,y-5,2,10,'#fff0c7');}
   c.globalAlpha=alpha*v.opacity*fade;line(c,[[x-6*scale,y-24*scale],[x,y]],'#ccb576',2*scale);box(c,x-9*scale,y-27*scale,6*scale,3,'#e6e5d5');
  }
  // Preview only the next pulse; never show a seventh volley after the last hit.
  if(z.pulses<6&&v.fall>0){const lift=(1-v.fall)*190,ax=x-lift*.3,ay=y-lift;c.globalAlpha=alpha*v.opacity*.85;
   line(c,[[ax-12*scale,ay-40*scale],[ax,ay]],'#e2cc95',major?4:2);line(c,[[ax-4*scale,ay-8*scale],[ax,ay],[ax+3*scale,ay-8*scale]],'#fff2d4',major?3:2);box(c,ax-15*scale,ay-41*scale,9*scale,4,'#b7995f');
   if(!reduced){c.globalAlpha*=.3;line(c,[[ax-18*scale,ay-65*scale],[ax-9*scale,ay-32*scale]],'#bbd3d0',major?5:2);}
  }
 }
 if(v.pulse===5&&age<.16){c.globalAlpha=alpha*v.opacity*(1-age/.16)*.45;for(let i=0;i<(reduced?4:12);i++){const a=i*Math.PI*2/(reduced?4:12),r=40+age*300;box(c,z.x+Math.cos(a)*r,z.y+Math.sin(a)*r*.55,4,2,'#d5b46e');}}
 c.restore();
}
function drawCrossbowLegacy(c,t,reduced=false){const v=turretVisualState(t);if(t.time<=0)return;c.save();clipArena(c);c.translate(Math.round(t.x),Math.round(t.y));c.globalAlpha*=v.opacity;const alpha=c.globalAlpha;
 // Feet deploy outward; the mechanism can still fire immediately as before.
 box(c,-20,12,40,7,'#0c151c88');
 for(const side of [-1,1]){const x=side*(7+v.build*9);line(c,[[0,3],[x,14]],'#202730',7);line(c,[[0,3],[x,14]],'#8b7858',3);box(c,x-4,13,8,4,'#b39a6d');}
 for(const side of [-1,1]){box(c,side*12-2,6,4,3,'#96abb0');box(c,side*12-1,6,2,1,'#d2e7e4');}box(c,-9,0,18,12,'#3c3934');box(c,-8,0,16,3,'#d5bb80');box(c,-3,-4,6,11,'#a68b5d');
 if(v.build<1){c.globalAlpha=alpha*(1-v.build);for(let i=0;i<(reduced?2:6);i++){const a=i*Math.PI*2/(reduced?2:6);box(c,Math.cos(a)*(14+v.build*20),14+Math.sin(a)*7,4,2,'#d8c690');box(c,Math.cos(a)*(10+v.build*12),-28*(1-v.build)+Math.sin(a)*8,2,5,'#fff0bd');}c.globalAlpha=alpha;}
 c.save();c.translate(0,-3-(1-v.build)*8);c.rotate(t.aim||0);c.translate(-v.recoil*5,0);
 line(c,[[-7,-19],[5,-13],[10,0],[5,13],[-7,19]],'#18222c',7);
 line(c,[[-7,-19],[5,-13],[10,0],[5,13],[-7,19]],'#bba16c',4);
 line(c,[[-7,-19],[-7-v.recoil*5,0],[-7,19]],'#eee0b5',1);
 const tint=t.build?.fire?'#efaa78':t.build?.frost?'#a9deee':t.build?.poison?'#b4d68b':t.build?.chain?'#cdb6ed':'#e4cf9d';box(c,-16,-5,39,10,'#222b31');box(c,-14,-4,34,3,'#d8c492');box(c,-11,2,28,2,'#8f7853');box(c,-5,-8,6,16,'#a18556');box(c,-3,-3,3,5,tint);for(let i=0;i<3;i++){box(c,-12+i*8,-3,2,1,'#f0dfb6');box(c,-12+i*8,3,2,1,'#6f8586');}
 box(c,12,-2,16,4,'#dbe2d4');box(c,-16,-3,4,6,'#6b5541');for(const side of [-1,1])box(c,-8,side*16-2,4,4,'#e7ca82');
 if(v.recoil>.35){c.globalAlpha=alpha*v.recoil;line(c,[[27,0],[36,0]],'#fff0bb',2);if(!reduced){line(c,[[28,-2],[32,-6]],'#d7c493',1);line(c,[[28,2],[32,6]],'#d7c493',1);}}
 c.restore();c.globalAlpha=alpha*.8;box(c,-17,23,34,2,'#17212b');box(c,-17,23,Math.ceil(34*v.remaining),2,'#d5b97a');c.restore();}

export function drawCrossbow(c,t,reduced=false){
 if(!(t.time>0))return;const v=turretVisualState(t);c.save();clipArena(c);c.translate(Math.round(t.x),Math.round(t.y));c.globalAlpha*=v.opacity;const alpha=c.globalAlpha;
 const drawn=drawCrossbowArt(c,t,v);
 if(drawn){
  const tint=t.build?.fire?'#efaa78':t.build?.frost?'#a9deee':t.build?.poison?'#b4d68b':t.build?.chain?'#cdb6ed':'#e4cf9d';
  c.save();c.translate(0,-3);c.rotate(t.aim||0);box(c,9,-2,3,3,tint);
  if(v.recoil>.35){c.globalAlpha*=v.recoil;line(c,[[29,0],[43,0]],'#fff0bb',3);if(!reduced){line(c,[[31,-2],[37,-7]],tint,2);line(c,[[31,2],[37,7]],tint,2);}}c.restore();
  if(v.build<1&&!reduced){const age=1-v.build;c.globalAlpha*=age*.55;for(let i=0;i<4;i++)box(c,-18+i*12,18+Math.sin(i)*3,4,2,'#b7a07e');}
  c.globalAlpha=alpha*.8;box(c,-20,25,40,2,'#17212b');box(c,-20,25,Math.ceil(40*v.remaining),2,'#d5b97a');
 }
 c.restore();if(!drawn)drawCrossbowLegacy(c,t,reduced);
}
export function drawCrossbowEnding(c,t,reduced=false){
 if(!(t.time>0))return;const age=clamp(1-t.time/.4);c.save();clipArena(c);c.globalAlpha*=1-age;c.translate(t.x,t.y);
 const art=drawCrossbowArt(c,t,{ending:true});
 for(let i=0;i<(reduced?4:10);i++){const a=i*Math.PI*2/(reduced?4:10),r=6+age*22;box(c,Math.cos(a)*r,Math.sin(a)*r*.4-age*17,3,3,i%2?'#c6ae7b':'#e4eee3');}
 if(!art)line(c,[[-16*(1-age),5],[0,12-age*8],[16*(1-age),5]],'#ad9a75',3);c.restore();
}
