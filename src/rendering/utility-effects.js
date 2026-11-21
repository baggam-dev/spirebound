// Separate geometric effects; these functions never advance combat timers.
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
 const kind={focus:'focusCast',firstAid:'bloodCast',guardian:'guardianCast'}[id];
 return kind?{utilityFx:kind,x:s.player.x,y:s.player.y-12,t:.35,duration:.35}:null;
}
export function limitUtilityEffects(effects,limit=12){
 let remaining=limit;const keep=new Set();
 for(let i=effects.length-1;i>=0;i--)if(!effects[i].utilityFx||remaining-- > 0)keep.add(i);
 return effects.filter((_,i)=>keep.has(i));
}
export function drawExpandedUtilityStates(c,s,{reduced=false}={}){
 const q=s.utilityCast,p=s.player,clock=reduced?0:s.elapsed;
 c.save();
 if(p.focusTime>0){
  c.save();c.translate(p.x,p.y);c.globalAlpha*=Math.min(1,p.focusTime/.5)*(reduced?.4:.55);c.strokeStyle='#d28d94';c.lineWidth=2;
  for(const side of [-1,1]){const bob=reduced?0:Math.sin(clock*3+side)*1.1;c.beginPath();c.moveTo(side*23,-8+bob);c.lineTo(side*18,-16+bob);c.lineTo(side*21,-23+bob);c.stroke();}c.restore();
 }
 if(s.bloodTime>0){
  c.save();c.translate(p.x-23,p.y-32);c.globalAlpha*=Math.min(1,s.bloodTime/.4)*.65;c.strokeStyle='#d594b1';c.lineWidth=2;c.beginPath();c.arc(0,0,6,.25,Math.PI*1.65);c.stroke();c.restore();
 }
 if(s.guardianTime>0&&s.guardianCharges>0){
  c.save();c.globalAlpha*=Math.min(1,s.guardianTime/.5)*(reduced?.5:.7);c.strokeStyle='#dfd2a6';c.lineWidth=2;
  c.beginPath();c.arc(p.x+24,p.y-24,8+(reduced?0:Math.sin(clock*2)*.4),0,Math.PI*2);c.stroke();
  if(!reduced){c.globalAlpha*=.4;c.beginPath();c.ellipse(p.x,p.y-10,27,37,0,-.8,.8);c.stroke();}c.restore();
 }
 if(q?.id==='thunderSigil'&&q.floor===s.floor&&q.room===s.room){
  c.save();
  const progress=1-q.remaining/.65,r=10+progress*6;c.strokeStyle='#b6e5ef';c.lineWidth=2;c.globalAlpha*=.55+progress*.3;
  c.beginPath();c.moveTo(q.x,q.y-r*.5);c.lineTo(q.x+r,q.y);c.lineTo(q.x,q.y+r*.5);c.lineTo(q.x-r,q.y);c.closePath();c.stroke();
  if(!reduced){c.fillStyle='#d5f4ed';c.fillRect(Math.round(q.x)-1,Math.round(q.y-16-progress*10),2,4);}
  c.restore();
 }
 if(p.galeTime>0){
  c.save();
  c.strokeStyle='#acccad';c.lineWidth=2;c.globalAlpha*=Math.min(1,p.galeTime/.35)*(reduced?.45:.65);
  for(let i=0;i<(reduced?1:2);i++){c.beginPath();c.ellipse(p.x,p.y+6+i*4,25+i*8,7+i*3,0,Math.PI*.12,Math.PI*.84);c.stroke();}
  c.fillStyle='#d4e2bb';for(let i=0;i<(p.galeCharges||0);i++)c.fillRect(Math.round(p.x-4+i*7),Math.round(p.y-38),3,3);
  c.restore();
 }
 c.restore();
}
export function drawUtilityEffect(c,f,{reduced=false,player=null}={}){
 if(!f.utilityFx)return false;
 const p=Math.max(0,Math.min(1,1-f.t/f.duration));c.save();c.translate(f.x,f.y);c.globalAlpha*=1-p;c.lineWidth=2;
 if(['focusCast','focusExpire','focusShot'].includes(f.utilityFx)){
  const expire=f.utilityFx==='focusExpire',shot=f.utilityFx==='focusShot',r=shot?3+p*4:expire?16-p*6:9+p*14;c.strokeStyle='#df9ba1';c.fillStyle='#e7b7ad';
  for(let i=0,n=shot?3:reduced?4:6;i<n;i++){const a=i*Math.PI*2/n;c.beginPath();c.moveTo(Math.cos(a)*r,Math.sin(a)*r*.7+(expire?p*9:0));c.lineTo(Math.cos(a)*(r+4),Math.sin(a)*(r+4)*.7+(expire?p*9:0));c.stroke();}
 }else if(['bloodCast','bloodExpire'].includes(f.utilityFx)){
  c.strokeStyle='#d7a0bb';c.beginPath();c.arc(-12,-12,(f.utilityFx==='bloodExpire'?8*(1-p):6+p*5),.25,Math.PI*1.65);c.stroke();
 }else if(f.utilityFx==='bloodHeal'){
  const tx=(player?.x??f.x)-f.x,ty=(player?player.y-18:f.y)-f.y;
  let dx=(f.fromX??f.x-22)-f.x-tx,dy=(f.fromY??f.y+12)-f.y-ty;const length=Math.hypot(dx,dy);if(length>180){dx*=180/length;dy*=180/length;}
  c.fillStyle='#e1a6c0';for(let i=0,n=reduced?2:5;i<n;i++){const q=Math.min(1,p+i*.035),x=tx+dx*(1-q),y=ty+dy*(1-q)-Math.sin(q*Math.PI)*12;c.fillRect(Math.round(x),Math.round(y),2,3);}
 }else if(['guardianCast','guardianBreak','guardianExpire'].includes(f.utilityFx)){
  c.strokeStyle='#e4d8b1';const breaking=f.utilityFx==='guardianBreak',expire=f.utilityFx==='guardianExpire';
  if(breaking){for(let i=0,n=reduced?3:6;i<n;i++){const a=(f.angle||0)+i*Math.PI*2/n,r=17+p*19,x=Math.cos(a)*r,y=Math.sin(a)*r*.8;c.beginPath();c.moveTo(x-3,y);c.lineTo(x,y-3);c.lineTo(x+3,y);c.stroke();}}
  else{const r=expire?26*(1-p):12+p*14;c.beginPath();c.ellipse(0,0,r,r*1.2,0,0,Math.PI*2);c.stroke();}
 }else if(f.utilityFx==='frostWave'){
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
