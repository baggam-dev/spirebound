// A contact accent for plain and precision arrows, including lethal hits.
// Elemental arrows already have dedicated contact visuals.
export function arrowImpactEffect(arrow,point){
 if(arrow.frostShard||['fire','frost','poison','chain'].includes(arrow.element))return null;
 return {arrowImpact:true,x:point.x,y:point.y,angle:Math.atan2(arrow.vy,arrow.vx),precision:arrow.element==='precision',t:.2,duration:.2};
}
export function limitArrowImpacts(effects,max=24){
 let skip=Math.max(0,effects.reduce((n,f)=>n+!!f.arrowImpact,0)-max);
 return effects.filter(f=>!f.arrowImpact||skip--<=0);
}
export function drawArrowImpact(c,f,reduced=false){
 if(!f.arrowImpact)return false;
 if(!(f.t>0))return true;
 const life=Math.max(0,Math.min(1,f.t/f.duration));
 c.save();c.beginPath();c.rect(25,45,910,455);c.clip();
 c.translate(Math.round(f.x),Math.round(f.y));c.rotate(f.angle);
 const age=1-life,spread=1-life*life;
 c.globalAlpha*=life*life*.9;
 const light=f.precision?'#fff0bf':'#f4e6c4',shade=f.precision?'#d4b775':'#baa88e';
 if(age<.4){c.fillStyle=shade;c.fillRect(-3,-2,6,4);c.fillStyle=light;c.fillRect(-1,-2,3,4);c.fillRect(-3,-1,7,2);}
 c.fillStyle=age<.45?light:shade;
 for(let i=0;i<(reduced?2:5);i++){
  const side=i%2?1:-1,x=2+spread*(5+i*2),y=side*(1+spread*(2+i));
  c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round((f.precision?6:4)*life)),1);
 }
 if(f.precision&&age<.55){c.fillStyle='#fff3ce';c.fillRect(2+Math.round(spread*8),-1,reduced?3:6,2);}
 c.restore();return true;
}

// Attached to the existing precision burst label, never a new damage roll.
export function drawPrecisionBurst(c,f,reduced=false){
 if(!f.precisionBurst)return;
 const seconds=.65-f.t,age=seconds/.2;if(age<0||age>=1)return;
 c.save();c.beginPath();c.rect(25,45,910,455);c.clip();
 c.translate(Math.round(f.x),Math.round(f.y+28));c.rotate(f.hitAngle||0);
 c.globalAlpha*=(1-age)**1.2;
 const shard=(x,y,a,length,width,color)=>{c.save();c.translate(x,y);c.rotate(a);c.fillStyle=color;c.beginPath();c.moveTo(-length*.3,0);c.lineTo(length*.35,-width);c.lineTo(length,0);c.lineTo(length*.35,width);c.closePath();c.fill();c.restore();};
 if(seconds<.055){shard(0,0,0,reduced?16:23,reduced?3:5,'#fff3ce');if(!reduced)shard(0,0,Math.PI/2,9,2,'#fff3ce');}
 const spread=1-(1-age)**3,count=reduced?2:6;
 for(let i=0;i<count;i++){const a=(i-(count-1)/2)*.22,r=4+spread*(14+i*2);shard(Math.cos(a)*r,Math.sin(a)*r,a,(reduced?7:12)*(1-age)+1,reduced?1:2,seconds<.075?'#ffe1a0':'#c99b57');}
 c.restore();
}

// Original Canvas geometry: narrow tapered ribbon, no particle simulation.
export function drawSlashRibbon(c,radius,progress,{start=-1.2,end=1.2,color='#6caade',reduced=false,heavy=false}={}){
 const p=Math.max(0,Math.min(1,progress)),sweep=end-start,head=start+sweep*p,tail=start+sweep*Math.max(0,p-.55);
 if(head<=tail)return;
 c.save();c.globalAlpha*=Math.min(1,(1-p)*4);
 const ribbon=(r,width,light)=>{
  for(let i=0;i<14;i++){
   const u=i/14,v=(i+1)/14,a=tail+(head-tail)*u,b=tail+(head-tail)*v,w=width*(.12+.88*Math.sin(u*Math.PI/2));
   c.fillStyle=light&&i>10?'#edfbff':color;c.beginPath();c.moveTo(Math.cos(a)*r,Math.sin(a)*r);c.lineTo(Math.cos(b)*r,Math.sin(b)*r);c.lineTo(Math.cos(b)*(r-w),Math.sin(b)*(r-w));c.lineTo(Math.cos(a)*(r-w),Math.sin(a)*(r-w));c.closePath();c.fill();
  }
 };
 ribbon(radius,Math.min(radius*.35,heavy?(reduced?6:14):(reduced?3:6)),true);
 if(!reduced){c.globalAlpha*=.28;ribbon(radius-7,2,false);}
 c.restore();
}

export function drawSlashContact(c,f,reduced=false){
 if(!f.slash)return false;if(!(f.t>0))return true;
 c.save();c.beginPath();c.rect(25,45,910,455);c.clip();c.translate(Math.round(f.x),Math.round(f.y));c.rotate(f.angle||0);
 drawSlashRibbon(c,17,1-Math.min(1,f.t/.14),{color:f.color||'#c8b3e7',reduced});c.restore();return true;
}
