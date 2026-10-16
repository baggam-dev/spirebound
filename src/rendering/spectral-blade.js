import {bladeProfile,bladeColor,spectralBladeState} from '../combat/spectral-blade.js';

let image=null;
export const spectralBladeReady=typeof Image==='undefined'?Promise.resolve(false):new Promise(resolve=>{
 const source=new Image();source.onload=()=>{image=source;resolve(true);};source.onerror=()=>resolve(false);
 source.src=new URL('../../assets/images/vergas-blade-v1.png',import.meta.url).href;
});
export function drawSpectralBlade(c,s,reduced=false){
 const p=s.player;if(!p.aura)return;
 for(const e of s.floors[s.floor][s.room].enemies)if(e.hp>0&&e.bladeDot){
  c.save();c.fillStyle=e.bladeDot.kind==='fire'?'#e6a16c':'#a7cb82';c.fillRect(Math.round(e.x-3),Math.round(e.y-22),3,5);c.restore();
 }
 const state=spectralBladeState(s),profile=bladeProfile(p),time=s.elapsed||0;
 let x=p.x-25,y=p.y-12+(reduced?0:Math.sin(time*2.7)*2),angle=-.22;
 let swing=0;
 if(state){
  const active=state.time-profile.windup,end=.18*(profile.strikes-1)+.12;
  if(active<0){angle=state.aim+Math.PI/2-.65;}
  else if(active<=end){
   const local=Math.min(1,(active% .18)/.12);swing=1;
   angle=state.aim+Math.PI/2-profile.halfAngle+2*profile.halfAngle*local;
   x=p.x+Math.cos(angle-Math.PI/2)*profile.radius*.72;y=p.y+Math.sin(angle-Math.PI/2)*profile.radius*.72-7;
   if(!reduced){c.save();c.strokeStyle=bladeColor(p);c.globalAlpha=.45;c.lineWidth=3;c.beginPath();c.arc(p.x,p.y-7,profile.radius*.82,state.aim-profile.halfAngle,state.aim+profile.halfAngle);c.stroke();c.restore();}
  }else{const back=Math.max(0,1-(active-end)/.16);x+=(p.x+Math.cos(state.aim)*profile.radius*.72-x)*back;y+=(p.y+Math.sin(state.aim)*profile.radius*.72-7-y)*back;angle=state.aim+Math.PI/2;}
 }
 c.save();c.translate(Math.round(x),Math.round(y));c.rotate(angle);c.imageSmoothingEnabled=false;
 // Alpha cutout retains the original; crop transparent padding only at draw.
 if(image)c.drawImage(image,328,45,368,1445,-4,-20,8,32);
 else{c.fillStyle='#c8cbd0';c.fillRect(-1,-22,3,29);c.fillStyle='#9b8053';c.fillRect(-5,6,11,2);c.fillStyle='#595060';c.fillRect(-1,8,3,8);}
 if(!reduced&&!swing){c.globalAlpha=.55;c.fillStyle=bladeColor(p);c.fillRect(-1,-8,2,2);}
 c.restore();
}
