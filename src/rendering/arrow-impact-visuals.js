// A contact accent for plain and precision arrows, including lethal hits.
// Elemental arrows already have dedicated contact visuals.
export function arrowImpactEffect(arrow,point,elementContacts=null){
 const elemental=elementContacts!==null?elementContacts.length>0:arrow.element==='poison'||arrow.elemental!==false&&['fire','frost','chain'].includes(arrow.element);
 if(arrow.frostShard||elemental)return null;
 return {arrowImpact:true,x:point.x,y:point.y,angle:Math.atan2(arrow.vy,arrow.vx),precision:arrow.element==='precision',t:.2,duration:.2};
}
export function limitArrowImpacts(effects,max=24){
 const keep=new Set();let slots=max;
 // Preserve precision contacts before ordinary multi-shot noise. Select by
 // index so repeated references still count toward the unchanged global cap.
 for(const precision of [true,false])for(let i=effects.length-1;i>=0&&slots>=1;i--){
  const f=effects[i];if(f.arrowImpact&&!!f.precision===precision){keep.add(i);slots--;}
 }
 return effects.filter((f,i)=>!f.arrowImpact||keep.has(i));
}
// One short contact, three visual weights. No actor motion or gameplay clocks.
export function prepareContactStyle(c){
 c.globalCompositeOperation='source-over';c.setLineDash([]);c.lineCap='butt';c.lineJoin='miter';
}
export function drawImpactAccent(c,{x,y,age,angle=0,strength=0,reduced=false,color='#fff0c5',duration=.2}){
 if(age<0||age>=duration)return;
 const power=[1,1.45,1.9][Math.max(0,Math.min(2,strength))],fade=1-age/duration;
 const shard=(x,y,a,length,width,fill)=>{c.save();c.translate(x,y);c.rotate(a);c.fillStyle=fill;c.beginPath();c.moveTo(-length*.2,0);c.lineTo(length*.5,-width);c.lineTo(length,0);c.lineTo(length*.5,width);c.closePath();c.fill();c.restore();};
 c.save();prepareContactStyle(c);c.beginPath();c.rect(25,45,910,455);c.clip();c.translate(Math.round(x),Math.round(y));c.rotate(angle);const alpha=c.globalAlpha;
 if(age<.045){c.globalAlpha=alpha*(1-age/.045);shard(0,0,0,13*power,4*power,'#3b2c24');shard(0,0,0,10*power,1.8*power,color);if(strength&&!reduced)shard(0,0,Math.PI/2,5*power,1.4,color);}
 const count=reduced?(strength?3:2):3+strength*2;c.globalAlpha=alpha*fade**1.5;
 for(let i=0;i<count;i++){const a=-1.1+i*2.2/(count-1),r=(3+age*78)*power;shard(Math.cos(a)*r,Math.sin(a)*r*.55,a,Math.max(1,(6+strength*2)*fade),.8+strength*.4,i%2?'#c99b57':color);}
 c.restore();
}
// Low ground chips and dust belong to landings, not every hit on an enemy body.
export function drawGroundContact(c,{x,y,age,reduced=false,finishing=false}){
 if(age<0||age>=.26)return;
 const fade=1-age/.26,power=finishing?1.15:1,count=reduced?3:6;
 c.save();prepareContactStyle(c);c.beginPath();c.rect(25,45,910,455);c.clip();c.translate(Math.round(x),Math.round(y));
 const alpha=c.globalAlpha;c.globalAlpha=alpha*fade*.35;c.fillStyle='#251e19';c.fillRect(-9,-2,18,4);
 for(let i=0;i<count;i++){
  const a=i*2.4,r=(6+age*75)*power,px=Math.cos(a)*r,py=Math.sin(a)*r*.3;
  c.globalAlpha=alpha*fade*(reduced?.35:.5);c.fillStyle='#897660';c.fillRect(Math.round(px-3),Math.round(py),6,2);
  c.globalAlpha=alpha*fade*.85;c.fillStyle=i%2?'#9e8a6b':'#5d5344';c.beginPath();c.moveTo(px-2,py);c.lineTo(px,py-3-age*12);c.lineTo(px+3,py-1);c.closePath();c.fill();
 }
 c.restore();
}
export function drawArrowImpact(c,f,reduced=false){
 if(!f.arrowImpact)return false;
 if(!(f.t>0))return true;
 drawImpactAccent(c,{x:f.x,y:f.y,age:f.duration-f.t,duration:f.duration,angle:f.angle,strength:f.precision?1:0,reduced});return true;
}

// Attached to the existing precision burst label, never a new damage roll.
export function drawPrecisionBurst(c,f,reduced=false){
 if(!f.precisionBurst||f.criticalBurst)return;
 drawImpactAccent(c,{x:f.x,y:f.y+28,age:.65-f.t,angle:f.hitAngle||0,strength:1,reduced,color:'#fff3ce'});
}

// Original Canvas geometry: narrow tapered ribbon, no particle simulation.
export function drawSlashRibbon(c,radius,progress,{start=-1.2,end=1.2,color='#6caade',reduced=false,heavy=false}={}){
 const p=Math.max(0,Math.min(1,progress)),sweep=end-start,head=start+sweep*p,tail=start+sweep*Math.max(0,p-.55);
 if(head<=tail)return;
 c.save();prepareContactStyle(c);c.globalAlpha*=Math.min(1,(1-p)*4);
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
