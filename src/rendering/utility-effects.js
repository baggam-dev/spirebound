// Separate geometric effects; these functions never advance combat timers.
export function drawExpandedUtilityStates(c,s,{reduced=false}={}){
 const q=s.utilityCast,p=s.player;
 c.save();
 if(q?.id==='thunderSigil'&&q.floor===s.floor&&q.room===s.room){
  const progress=1-q.remaining/.65,r=10+progress*6;c.strokeStyle='#b6e5ef';c.lineWidth=2;c.globalAlpha*=.55+progress*.3;
  c.beginPath();c.moveTo(q.x,q.y-r*.5);c.lineTo(q.x+r,q.y);c.lineTo(q.x,q.y+r*.5);c.lineTo(q.x-r,q.y);c.closePath();c.stroke();
  if(!reduced){c.fillStyle='#d5f4ed';c.fillRect(Math.round(q.x)-1,Math.round(q.y-16-progress*10),2,4);}
 }
 if(p.galeTime>0){
  c.strokeStyle='#acccad';c.lineWidth=2;c.globalAlpha*=Math.min(1,p.galeTime/.35)*(reduced?.45:.65);
  for(let i=0;i<(reduced?1:2);i++){c.beginPath();c.ellipse(p.x,p.y+6+i*4,25+i*8,7+i*3,0,Math.PI*.12,Math.PI*.84);c.stroke();}
  c.fillStyle='#d4e2bb';for(let i=0;i<(p.galeCharges||0);i++)c.fillRect(Math.round(p.x-4+i*7),Math.round(p.y-38),3,3);
 }
 c.restore();
}
export function drawUtilityEffect(c,f,{reduced=false}={}){
 if(!f.utilityFx)return false;
 const p=Math.max(0,Math.min(1,1-f.t/f.duration));c.save();c.translate(f.x,f.y);c.globalAlpha*=1-p;c.lineWidth=2;
 if(f.utilityFx==='frostWave'){
  const radius=f.r*(1-(1-p)**2);c.strokeStyle='#a9dce9';c.fillStyle='#c8eaf0';
  for(let i=0,n=reduced?6:12;i<n;i++){const a=i*Math.PI*2/n;c.beginPath();c.moveTo(Math.cos(a)*radius*.9,Math.sin(a)*radius*.9);c.lineTo(Math.cos(a+.08)*radius,Math.sin(a+.08)*radius);c.stroke();if(!reduced)c.fillRect(Math.round(Math.cos(a)*radius),Math.round(Math.sin(a)*radius),2,3);}
 }else if(f.utilityFx==='thunderSigil'){
  c.strokeStyle='#d7f5f3';c.beginPath();c.moveTo(3,-(reduced?25:58)*(1-p));c.lineTo(-4,-23*(1-p));c.lineTo(5,-19*(1-p));c.lineTo(0,0);c.stroke();
  c.fillStyle='#b5dce5';for(let i=0,n=reduced?4:8;i<n;i++){const a=i*Math.PI*2/n,r=8+p*20;c.fillRect(Math.round(Math.cos(a)*r),Math.round(Math.sin(a)*r*.5),2,2);}
 }else if(f.utilityFx==='galeBreak'){
  c.fillStyle='#c6dfbe';for(let i=0,n=reduced?3:6;i<n;i++){const a=i*2.4,r=3+p*14;c.fillRect(Math.round(Math.cos(a)*r),Math.round(Math.sin(a)*r),3,1);}
 }
 c.restore();return true;
}
