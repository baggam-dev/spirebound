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
// One short contact, three visual weights. No actor motion or gameplay clocks.
export function drawImpactAccent(c,{x,y,age,angle=0,strength=0,reduced=false,color='#fff0c5',duration=.2}){
 if(age<0||age>=duration)return;
 const power=[1,1.6,2.2][Math.max(0,Math.min(2,strength))],fade=1-age/duration;
 const shard=(x,y,a,length,width,fill)=>{c.save();c.translate(x,y);c.rotate(a);c.fillStyle=fill;c.beginPath();c.moveTo(-length*.2,0);c.lineTo(length*.5,-width);c.lineTo(length,0);c.lineTo(length*.5,width);c.closePath();c.fill();c.restore();};
 c.save();c.beginPath();c.rect(25,45,910,455);c.clip();c.translate(Math.round(x),Math.round(y));c.rotate(angle);const alpha=c.globalAlpha;
 if(age<.045){c.globalAlpha=alpha*(1-age/.045);shard(0,0,0,14*power,6*power,'#3b2c24');shard(0,0,0,12*power,3*power,color);if(strength&&!reduced)shard(0,0,Math.PI/2,6*power,2,color);}
 const count=reduced?2:4+strength*2;c.globalAlpha=alpha*fade**1.5;
 for(let i=0;i<count;i++){const a=-1.2+i*2.4/(count-1),r=(4+age*105)*power;shard(Math.cos(a)*r,Math.sin(a)*r*.6,a,Math.max(1,(7+strength*3)*fade),1+strength*.5,i%2?'#c99b57':color);}
 c.restore();
}
export function drawArrowImpact(c,f,reduced=false){
 if(!f.arrowImpact)return false;
 if(!(f.t>0))return true;
 drawImpactAccent(c,{x:f.x,y:f.y,age:f.duration-f.t,duration:f.duration,angle:f.angle,strength:f.precision?1:0,reduced});return true;
}

// Attached to the existing precision burst label, never a new damage roll.
export function drawPrecisionBurst(c,f,reduced=false){
 if(!f.precisionBurst)return;
 drawImpactAccent(c,{x:f.x,y:f.y+28,age:.65-f.t,angle:f.hitAngle||0,strength:1,reduced,color:'#fff3ce'});
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
 drawImpactAccent(c,{x:f.x,y:f.y,age:.14-f.t,duration:.14,angle:f.angle||0,strength:1,reduced,color:f.color||'#e4d7f7'});
 c.save();c.beginPath();c.rect(25,45,910,455);c.clip();c.translate(Math.round(f.x),Math.round(f.y));c.rotate(f.angle||0);
 drawSlashRibbon(c,17,1-Math.min(1,f.t/.14),{color:f.color||'#c8b3e7',reduced});c.restore();return true;
}
