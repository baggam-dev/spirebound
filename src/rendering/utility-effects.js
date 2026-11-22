// Separate geometric effects; these functions never advance combat timers.
import {drawImpactAccent} from './arrow-impact-visuals.js';
export function captureUtilityVisuals(s){return {floor:s.floor,room:s.room,focus:s.player.focusTime||0,blood:s.bloodTime||0,guardian:s.guardianTime||0,charges:s.guardianCharges||0};}
export function utilityTransitionEffects(before,s,result){
 if(before.floor!==s.floor||before.room!==s.room||s.player.hp<=0)return [];
 const out=[],add=utilityFx=>out.push({utilityFx,x:s.player.x,y:s.player.y-12,t:.35,duration:.35});
 if(before.focus>0&&!(s.player.focusTime>0))add('focusExpire');
 if(before.blood>0&&!(s.bloodTime>0))add('bloodExpire');
 if(before.guardian>0&&before.charges>0&&!(s.guardianTime>0&&s.guardianCharges>0)&&!result.effects.some(f=>f.utilityFx==='guardianBreak'))add('guardianExpire');
 if(s.player.focusTime>0&&result.events.some(e=>e==='shot'||e==='repeatShot'))out.push({utilityFx:'focusShot',x:s.player.x+12,y:s.player.y-24,t:.12,duration:.12});
 return out;
}
export function utilityCastEffect(s,id){
 const kind={focus:'focusCast',firstAid:'bloodCast',guardian:'guardianCast',frostWave:'frostCast',thunderSigil:'sigilCast',galeVeil:'galeCast'}[id],duration=['focus','firstAid','guardian','galeVeil'].includes(id)?.48:.28;
 return kind?{utilityFx:kind,x:s.player.x,y:s.player.y-12,t:duration,duration}:null;
}
export function limitUtilityEffects(effects,limit=12){
 let remaining=limit;const keep=new Set();
 // Contact chips are optional; they must not evict a cast, absorption or landing.
 for(let i=effects.length-1;i>=0;i--)if(!effects[i].utilityFx)keep.add(i);else if(!effects[i].utilityContact&&remaining>0){keep.add(i);remaining--;}
 const contacts=effects.map((f,i)=>({f,i})).filter(v=>v.f.utilityContact).sort((a,b)=>(b.f.contactPower||0)-(a.f.contactPower||0)||b.i-a.i);
 for(const {i} of contacts.slice(0,Math.max(0,Math.min(4,remaining))))keep.add(i);
 return effects.filter((_,i)=>keep.has(i));
}
function groundAura(c,x,y,r,color,clock,reduced){
 c.save();c.translate(x,y);c.scale(1,.38);c.globalAlpha*=reduced?.65:.8;
 const glow=c.createRadialGradient(0,0,r*.25,0,0,r);glow.addColorStop(0,color+'00');glow.addColorStop(.72,color+'32');glow.addColorStop(1,color+'00');c.fillStyle=glow;c.fillRect(-r,-r,r*2,r*2);
 c.strokeStyle=color;c.lineWidth=3;for(let i=0;i<2;i++){const a=i*Math.PI+(reduced?0:clock*.55);c.beginPath();c.arc(0,0,r*.83,a+.15,a+2.45);c.stroke();}c.restore();
}
function castRing(c,r,color,p,reduced){
 c.strokeStyle=color;c.lineWidth=reduced?2:3;
 for(let i=0;i<4;i++){const a=i*Math.PI/2;c.beginPath();c.arc(0,0,r,a+.1,a+1.15);c.stroke();}
 if(!reduced){c.save();c.globalAlpha*=.45;c.lineWidth=2;c.beginPath();c.arc(0,0,r*.66,0,Math.PI*2);c.stroke();c.restore();}
 for(let i=0,n=reduced?4:8;i<n;i++){const a=i*Math.PI*2/n,l=5+(1-p)*9;c.beginPath();c.moveTo(Math.cos(a)*r,Math.sin(a)*r);c.lineTo(Math.cos(a)*(r+l),Math.sin(a)*(r+l));c.stroke();}
}
export function drawExpandedUtilityStates(c,s,{reduced=false}={}){
 const q=s.utilityCast,p=s.player,clock=reduced?0:s.elapsed;
 if(!(p.hp>0))return;
 c.save();
 if(p.focusTime>0){
  c.save();c.globalAlpha*=Math.min(1,p.focusTime/.55);groundAura(c,p.x,p.y+9,40,'#e37d8b',clock,reduced);c.translate(p.x,p.y);c.strokeStyle='#eca1a2';c.lineWidth=3;
  for(const side of [-1,1]){const bob=reduced?0:Math.sin(clock*3+side)*1.5;c.beginPath();c.moveTo(side*27,-4+bob);c.lineTo(side*21,-17+bob);c.lineTo(side*25,-30+bob);c.stroke();}
  for(let i=0,n=reduced?3:8;i<n;i++){const life=(clock*.55+i*.197)%1;c.save();c.globalAlpha*=(1-life)*.7;c.fillStyle=i%2?'#f3bab1':'#d86e88';c.fillRect(Math.round(Math.sin(i*2.4)*25),Math.round(9-life*59),3,4);c.restore();}c.restore();
 }
 if(s.bloodTime>0){
  c.save();c.globalAlpha*=Math.min(1,s.bloodTime/.5);groundAura(c,p.x,p.y+9,41,'#d68caf',-clock,reduced);c.translate(p.x-23,p.y-35);c.strokeStyle='#f0bad1';c.lineWidth=3;c.beginPath();c.arc(0,0,10,.25,Math.PI*1.65);c.stroke();
  c.fillStyle='#e4a2c3';for(let i=0,n=reduced?2:4;i<n;i++){const a=i*Math.PI/2+clock*.4;c.fillRect(Math.round(Math.cos(a)*15),Math.round(Math.sin(a)*10),2,3);}c.restore();
 }
 if(s.guardianTime>0&&s.guardianCharges>0){
  c.save();c.globalAlpha*=Math.min(1,s.guardianTime/.5);groundAura(c,p.x,p.y+8,38,'#e4ce8c',clock,reduced);c.strokeStyle='#f1dfae';c.lineWidth=reduced?2:3;
  c.beginPath();c.ellipse(p.x,p.y-12,34,44,0,0,Math.PI*2);c.stroke();
  c.beginPath();c.arc(p.x+27,p.y-29,10,0,Math.PI*2);c.stroke();
  if(!reduced){c.globalAlpha*=.45;for(const side of [-1,1]){c.beginPath();c.ellipse(p.x+side*4,p.y-12,24,40,side*.25,-1.15,.9);c.stroke();}}c.restore();
 }
 if(q?.id==='thunderSigil'&&q.floor===s.floor&&q.room===s.room){
  c.save();
  const progress=1-q.remaining/.65,r=17+progress*6;c.strokeStyle='#c7f1f3';c.lineWidth=3;c.globalAlpha*=.65+progress*.3;
  c.beginPath();c.moveTo(q.x,q.y-r*.5);c.lineTo(q.x+r,q.y);c.lineTo(q.x,q.y+r*.5);c.lineTo(q.x-r,q.y);c.closePath();c.stroke();
  if(!reduced){c.fillStyle='#d5f4ed';for(let i=0;i<4;i++){const a=i*Math.PI/2;c.fillRect(Math.round(q.x+Math.cos(a)*(r+7)),Math.round(q.y+Math.sin(a)*(r+7)*.5),3,3);}c.fillRect(Math.round(q.x)-1,Math.round(q.y-23-progress*22),2,7);}
  c.restore();
 }
 if(p.galeTime>0){
  c.save();
  c.globalAlpha*=Math.min(1,p.galeTime/.35);groundAura(c,p.x,p.y+9,42,'#b5d9b4',clock*2,reduced);c.strokeStyle='#c8e4c2';c.lineWidth=reduced?2:3;
  for(let i=0;i<(reduced?2:3);i++){const a=reduced?.2:clock*2.8+i*2;c.beginPath();c.ellipse(p.x,p.y-4+i*8,31+i*5,12+i*3,-.18,a,a+Math.PI*1.2);c.stroke();}
  c.fillStyle='#d4e2bb';for(let i=0;i<(p.galeCharges||0);i++)c.fillRect(Math.round(p.x-4+i*7),Math.round(p.y-38),3,3);
  c.restore();
 }
 c.restore();
}
export function drawUtilityEffect(c,f,{reduced=false,player=null}={}){
 if(!f.utilityFx)return false;
 if(f.utilityContact){
  drawImpactAccent(c,{x:f.x,y:f.y,age:f.duration-f.t,duration:f.duration,angle:f.angle,strength:f.utilityFx==='sigilContact'?1:0,reduced,color:f.utilityFx==='frostContact'?'#c3eff4':'#e6ffff'});return true;
 }
 if(f.utilityFx==='galeBreak')drawImpactAccent(c,{x:f.x,y:f.y,age:f.duration-f.t,duration:f.duration,strength:0,reduced,color:'#c6dfbe'});
 const p=Math.max(0,Math.min(1,1-f.t/f.duration));c.save();c.translate(f.x,f.y);c.globalAlpha*=1-p;c.lineWidth=2;
 if(['frostCast','sigilCast','galeCast'].includes(f.utilityFx)){
  const wind=f.utilityFx==='galeCast',ice=f.utilityFx==='frostCast',color=wind?'#cae8bc':ice?'#c2edf5':'#d5f5f4';
  const r=8+(wind?42:ice?25:31)*(1-(1-p)**3);castRing(c,r,color,p,reduced);
  if(wind){c.strokeStyle=color;for(let i=0,n=reduced?2:4;i<n;i++){c.beginPath();c.ellipse(0,0,r,r*.45,-.3,i*Math.PI/2+p*2,i*Math.PI/2+p*2+1.6);c.stroke();}}
  else{c.fillStyle=color;c.fillRect(-2,-14*(1-p),4,6);}
 }else if(['focusCast','focusExpire','focusShot'].includes(f.utilityFx)){
  const expire=f.utilityFx==='focusExpire',shot=f.utilityFx==='focusShot',r=shot?3+p*4:expire?16-p*6:9+p*14;c.strokeStyle='#df9ba1';c.fillStyle='#e7b7ad';
  if(!expire&&!shot){castRing(c,10+49*(1-(1-p)**3),'#f0a0a5',p,reduced);if(p<.23){c.fillStyle='#f8dbbd';c.fillRect(-3,-13,6,26);c.fillRect(-13,-3,26,6);}}
  else for(let i=0,n=shot?3:reduced?4:6;i<n;i++){const a=i*Math.PI*2/n;c.beginPath();c.moveTo(Math.cos(a)*r,Math.sin(a)*r*.7+(expire?p*9:0));c.lineTo(Math.cos(a)*(r+4),Math.sin(a)*(r+4)*.7+(expire?p*9:0));c.stroke();}
 }else if(['bloodCast','bloodExpire'].includes(f.utilityFx)){
  const expire=f.utilityFx==='bloodExpire';if(!expire)castRing(c,12+37*(1-(1-p)**3),'#e8a0c4',p,reduced);
  c.strokeStyle='#f0bed3';c.lineWidth=expire?2:3;c.beginPath();c.arc(-12,-17,(expire?8*(1-p):10+6*Math.sin(p*Math.PI)),.25,Math.PI*1.65);c.stroke();
 }else if(f.utilityFx==='bloodHeal'){
  const tx=(player?.x??f.x)-f.x,ty=(player?player.y-18:f.y)-f.y;
  let dx=(f.fromX??f.x-22)-f.x-tx,dy=(f.fromY??f.y+12)-f.y-ty;const length=Math.hypot(dx,dy);if(length>180){dx*=180/length;dy*=180/length;}
  c.fillStyle='#efb7d1';for(let i=0,n=reduced?3:7;i<n;i++){const q=Math.min(1,p+i*.035),x=tx+dx*(1-q),y=ty+dy*(1-q)-Math.sin(q*Math.PI)*12;c.fillRect(Math.round(x),Math.round(y),3,4);}
 }else if(['guardianCast','guardianBreak','guardianExpire'].includes(f.utilityFx)){
  c.strokeStyle='#e4d8b1';const breaking=f.utilityFx==='guardianBreak',expire=f.utilityFx==='guardianExpire';
  if(breaking){c.lineWidth=3;for(let i=0,n=reduced?4:8;i<n;i++){const a=(f.angle||0)+i*Math.PI*2/n,r=21+p*35,x=Math.cos(a)*r,y=Math.sin(a)*r*.8;c.beginPath();c.moveTo(x-4,y);c.lineTo(x,y-5);c.lineTo(x+4,y);c.stroke();}}
  else{const r=expire?26*(1-p):15+25*(1-(1-p)**3);if(!expire)castRing(c,r,'#f0dba5',p,reduced);c.beginPath();c.ellipse(0,0,r,r*1.2,0,0,Math.PI*2);c.stroke();}
 }else if(f.utilityFx==='frostWave'){
  const radius=f.r*(1-(1-p)**3);c.strokeStyle='#c3eff4';c.fillStyle='#d5f5fa';c.lineWidth=reduced?2:4;
  for(let i=0,n=reduced?6:12;i<n;i++){const a=i*Math.PI*2/n;c.beginPath();c.arc(0,0,radius,a+.04,a+Math.PI*2/n-.08);c.stroke();c.beginPath();c.moveTo(Math.cos(a)*(radius-12),Math.sin(a)*(radius-12));c.lineTo(Math.cos(a+.06)*radius,Math.sin(a+.06)*radius);c.lineTo(Math.cos(a+.12)*(radius-12),Math.sin(a+.12)*(radius-12));c.stroke();}
  if(!reduced){c.globalAlpha*=.4;c.lineWidth=2;c.beginPath();c.arc(0,0,radius*.72,0,Math.PI*2);c.stroke();}
 }else if(f.utilityFx==='thunderSigil'){
  const bolt=()=>{c.beginPath();c.moveTo(9,-(reduced?72:142)*(1-p*.55));c.lineTo(-9,-58*(1-p*.4));c.lineTo(10,-64*(1-p*.4));c.lineTo(0,0);c.stroke();};
  if(!reduced){c.save();c.globalAlpha*=.24;c.strokeStyle='#8cc3d5';c.lineWidth=10;bolt();c.restore();}c.strokeStyle='#e6ffff';c.lineWidth=3;bolt();
  c.strokeStyle='#c2e8ef';c.lineWidth=2;c.beginPath();c.arc(0,0,f.r*(1-(1-p)**3),0,Math.PI*2);c.stroke();
  c.fillStyle='#c7e9f2';for(let i=0,n=reduced?4:10;i<n;i++){const a=i*Math.PI*2/n,r=10+p*35;c.fillRect(Math.round(Math.cos(a)*r),Math.round(Math.sin(a)*r*.5),3,3);}
 }else if(f.utilityFx==='galeBreak'){
  c.fillStyle='#c6dfbe';for(let i=0,n=reduced?3:6;i<n;i++){const a=i*2.4,r=3+p*14;c.fillRect(Math.round(Math.cos(a)*r),Math.round(Math.sin(a)*r),3,1);}
 }
 c.restore();return true;
}
