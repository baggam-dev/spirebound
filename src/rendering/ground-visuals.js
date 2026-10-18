import {drawEnemyField,drawEnemyImpact} from './enemy-attack-vfx.js';
// Player fields stay unchanged; hostile fields use sparse clipped edge notches.
export function drawSoftField(c,x,y,r,color,opacity=.25){
 if(!(r>0))return;c.save();const g=c.createRadialGradient(x,y,0,x,y,r);
 g.addColorStop(0,color+'99');g.addColorStop(.55,color+'70');g.addColorStop(.82,color+'38');g.addColorStop(1,color+'00');
 c.globalAlpha*=opacity;c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.restore();
}
export function drawGroundField(c,z,kind,time=0,reduced=false){
 if(['warning','blast','hostile'].includes(kind)){drawEnemyField(c,z.x,z.y,z.r,{kind:kind==='hostile'?'poison':'warning',time,reduced,progress:1-Math.min(1,z.time??1)});return;}
 const hostile=kind==='hostile',warning=kind==='warning'||kind==='blast',fire=kind==='fire';
 const color=warning?'#f2a08d':hostile?'#d6a1ef':fire?'#f7a45c':'#9bd788';
 c.save();drawSoftField(c,z.x,z.y,z.r,color,warning?.55+.15*Math.sin(time*9):.48);
 if(warning){
  c.fillStyle=color;const size=kind==='blast'?4:3;c.fillRect(z.x-size/2,z.y-10,size,11);c.fillRect(z.x-size/2,z.y+5,size,size);
 }else{
  c.beginPath();c.arc(z.x,z.y,Math.max(0,z.r-2),0,Math.PI*2);c.clip();
  for(let i=0;i<12;i++){const a=i*2.4,rad=z.r*Math.sqrt((i+.5)/12)*.85,x=Math.round(z.x+Math.cos(a)*rad),y=Math.round(z.y+Math.sin(a)*rad),phase=(time*(fire?1.6:.65)+i*.31)%1;
   c.fillStyle=color;c.globalAlpha=fire?.55:.28;
   if(fire){const h=4+Math.round(phase*9);c.fillStyle='#a84935';c.fillRect(x-3,y-h,6,h);c.fillStyle='#ed9556';c.fillRect(x-2,y-h-2,3,h+1);c.fillRect(x+1,y-h+3,2,h-2);c.fillStyle='#ffe3a1';c.fillRect(x-1,y-h+2,2,3);}
   else{c.fillRect(x-5,y-Math.round(phase*9),10,3);c.fillRect(x-2,y-3-Math.round(phase*9),7,3);if(!hostile){c.fillStyle='#b9dba0';c.fillRect(x+3,y-6-Math.round(phase*7),2,2);c.fillStyle='#547b57';c.fillRect(x-4,y+2,7,2);}}
  }
 }
 c.restore();
}
export function drawAuraField(c,p,r,time,shieldReady){
 c.save();drawSoftField(c,p.x,p.y,r,'#a6d7d0',.2);
 for(let i=0;i<7;i++){const a=i*2.4+time*.2,rad=r*Math.sqrt((i+.5)/7)*.7;c.fillStyle='#a6d7d055';c.fillRect(p.x+Math.cos(a)*rad,p.y+Math.sin(a)*rad,3,2);}
 if(shieldReady){drawSoftField(c,p.x,p.y,29,'#bde9ff',.45);c.fillStyle='#d7f2ff';c.fillRect(p.x-3,p.y-33,6,4);}
 c.restore();
}
export function drawBurst(c,f,reduced=false){
 if(!f.groundBurst)return false;const p=1-Math.max(0,Math.min(1,f.t/.6));
 if(f.hostileBurst){drawEnemyImpact(c,f.x,f.y,f.r,p,{reduced,color:f.color});return true;}
 c.save();c.globalAlpha=1-p;drawSoftField(c,f.x,f.y,f.r*(.2+.8*p),f.color,.75);
 for(let i=0;i<12;i++){const a=i*Math.PI/6,rr=f.r*(.15+p*.75),x=Math.round(f.x+Math.cos(a)*rr),y=Math.round(f.y+Math.sin(a)*rr);c.fillStyle=i%2?f.color:'#ffe5ba';c.fillRect(x-2,y-2,4,4);}
 c.restore();return true;
}
