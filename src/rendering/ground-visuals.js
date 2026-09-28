// Ground silhouettes always use the real gameplay radius. No random state.
export function drawGroundField(c,z,kind,time=0){
 const hostile=kind==='hostile',warning=kind==='warning'||kind==='blast',fire=kind==='fire';
 const color=warning?'#f2a08d':hostile?'#d6a1ef':fire?'#f7a45c':'#9bd788';
 c.save();c.lineWidth=warning?2:1.5;c.strokeStyle=color;c.fillStyle=warning?'#db665517':hostile?'#9e51b42a':fire?'#ed81351f':'#76be6320';
 c.setLineDash(warning?[5,5]:[]);c.beginPath();c.arc(z.x,z.y,z.r,0,Math.PI*2);c.fill();c.stroke();c.setLineDash([]);
 if(warning){
  for(let i=0;i<4;i++){const a=i*Math.PI/2;c.beginPath();c.moveTo(z.x+Math.cos(a)*(z.r-7),z.y+Math.sin(a)*(z.r-7));c.lineTo(z.x+Math.cos(a)*z.r,z.y+Math.sin(a)*z.r);c.stroke();}
  if(kind==='blast'){c.lineWidth=3;c.beginPath();c.arc(z.x,z.y,z.r-4,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.max(0,Math.min(1,1-z.time)));c.stroke();c.fillStyle=color;c.fillRect(z.x-2,z.y-9,4,10);c.fillRect(z.x-2,z.y+4,4,3);}
 }else{
  c.beginPath();c.arc(z.x,z.y,Math.max(0,z.r-2),0,Math.PI*2);c.clip();
  for(let i=0;i<12;i++){const a=i*2.4,rad=z.r*Math.sqrt((i+.5)/12)*.85,x=Math.round(z.x+Math.cos(a)*rad),y=Math.round(z.y+Math.sin(a)*rad),phase=(time*(fire?1.6:.65)+i*.31)%1;
   c.fillStyle=color;c.globalAlpha=fire?.55:.28;
   if(fire){const h=4+Math.round(phase*9);c.fillRect(x-2,y-h,4,h);c.fillStyle='#ffe3a1';c.fillRect(x-1,y-h+2,2,3);}
   else{c.fillRect(x-5,y-Math.round(phase*9),10,3);c.fillRect(x-2,y-3-Math.round(phase*9),7,3);}
  }
 }
 c.restore();
}
export function drawAuraField(c,p,r,time,shieldReady){
 c.save();c.strokeStyle='#a6d7d088';c.lineWidth=1;c.beginPath();c.arc(p.x,p.y,r,0,Math.PI*2);c.stroke();
 for(let i=0;i<3;i++){const a=time*.7+i*Math.PI*2/3;c.strokeStyle='#d8eee3';c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,r-3,a,a+.32);c.stroke();}
 if(shieldReady){c.strokeStyle='#bde9ff';c.lineWidth=2;for(let i=0;i<6;i++){const a=i*Math.PI/3;c.beginPath();c.arc(p.x,p.y,27,a+.08,a+.55);c.stroke();}c.fillStyle='#d7f2ff';c.fillRect(p.x-3,p.y-33,6,4);}
 c.restore();
}
export function drawBurst(c,f){
 if(!f.groundBurst)return false;const p=1-Math.max(0,Math.min(1,f.t/.6));
 c.save();c.globalAlpha=1-p;c.strokeStyle=f.color;c.lineWidth=3;c.beginPath();c.arc(f.x,f.y,f.r*(.2+.8*p),0,Math.PI*2);c.stroke();
 for(let i=0;i<12;i++){const a=i*Math.PI/6,rr=f.r*(.15+p*.75),x=Math.round(f.x+Math.cos(a)*rr),y=Math.round(f.y+Math.sin(a)*rr);c.fillStyle=i%2?f.color:'#ffe5ba';c.fillRect(x-2,y-2,4,4);}
 c.restore();return true;
}
