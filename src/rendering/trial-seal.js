// Geometry-only scene, drawn underneath existing danger outlines and enemy shots.
export function drawTrialSeal(c,t,{reduced=false}={}){
 if(!t)return;
 const p=Math.max(0,Math.min(1,t.elapsed/t.duration)),entry=t.kind==='entry';
 const fade=Math.min(1,p*7,Math.max(0,(1-p)*5)),radius=entry?28+45*(1-(1-p)**3):42+p*38;
 c.save();c.translate(t.x,t.y);c.scale(1,.46);c.lineWidth=reduced?2:3;c.strokeStyle=entry?'#b397dc':'#dfd0ef';c.fillStyle='#e8ddf2';c.globalAlpha*=fade*(reduced?.65:.85);
 for(let i=0;i<4;i++){
  const a=i*Math.PI/2,spread=entry?0:p*14;
  c.save();c.translate(Math.cos(a)*spread,Math.sin(a)*spread);c.beginPath();c.arc(0,0,radius,a+.13,a+Math.PI/2-.16);c.stroke();
  if(!reduced){c.beginPath();c.moveTo(Math.cos(a)*radius,Math.sin(a)*radius);c.lineTo(Math.cos(a)*(radius+8),Math.sin(a)*(radius+8));c.stroke();}c.restore();
 }
 if(!entry){for(let i=0,n=reduced?4:10;i<n;i++){const a=i*2.39996,r=18+p*72;c.fillRect(Math.round(Math.cos(a)*r),Math.round(Math.sin(a)*r-p*26),2,3);}}
 c.restore();
}
