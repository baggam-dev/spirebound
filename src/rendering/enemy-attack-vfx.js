// Code-native VFX use the real attack geometry. No actor, combat clock or RNG writes.
const TAU=Math.PI*2;
const clamp=n=>Math.max(0,Math.min(1,n));
function disk(c,x,y,r){c.beginPath();c.arc(x,y,Math.max(0,r),0,TAU);c.clip();}
function dot(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);}
export function drawEnemyField(c,x,y,r,{kind='warning',time=0,reduced=false,progress=0,opacity=1,accent}={}){
 if(!(r>0))return;c.save();disk(c,x,y,r);c.setLineDash([]);c.lineCap='butt';const alpha=c.globalAlpha*opacity;c.globalAlpha=alpha;
 const warning=kind==='warning',gravity=kind==='gravity',color=accent||(gravity?'#be9be2':warning?'#e9b278':'#bfa0cf');
 const halo=c.createRadialGradient(x,y,0,x,y,r);halo.addColorStop(0,warning?'#b47c5320':gravity?'#764e9a18':'#422c4c50');halo.addColorStop(.78,warning?'#b47c530c':'#59455d28');halo.addColorStop(1,'#00000000');c.fillStyle=halo;c.fillRect(x-r,y-r,r*2,r*2);
 const ticks=warning?12:8,phase=reduced?0:time*.7;
 for(let i=0;i<ticks;i++){const a=i*TAU/ticks,rr=r-2;c.strokeStyle=color;c.lineWidth=warning?1.3:1;c.globalAlpha=alpha*(warning?.62+.22*clamp(progress):.4);c.beginPath();c.moveTo(x+Math.cos(a)*(rr-3),y+Math.sin(a)*(rr-3));c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);c.stroke();}
 c.globalAlpha=alpha;
 if(warning){dot(c,x-1,y-8,2,7,'#f4d19a');dot(c,x-1,y+2,2,2,'#f4d19a');return c.restore();}
 if(gravity){
  for(let i=0;i<4;i++){const a=i*TAU/4+(reduced?0:time*.35),rr=r*(reduced?.48:.22+(1-(time*.32+i*.25)%1)*.52);c.strokeStyle='#b69ad4';c.lineWidth=1.5;c.globalAlpha=alpha*.6;c.beginPath();c.arc(x,y,rr,a,a+.22);c.stroke();dot(c,x+Math.cos(a)*(rr-4),y+Math.sin(a)*(rr-4),2,1,'#d0b3e8');}
 }else{
  for(let i=0;i<(reduced?4:8);i++){const a=i*2.4,rr=r*Math.sqrt((i+.5)/8)*.75,px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr,pulse=reduced?.5:(Math.sin(phase+i*1.7)+1)/2;c.globalAlpha=alpha*.45;dot(c,px-4,py-1,8,2,'#76516e');c.strokeStyle='#a4ae6c';c.lineWidth=1;c.beginPath();c.arc(px,py-2-pulse*2,1.5+pulse,Math.PI*.15,Math.PI*1.75);c.stroke();dot(c,px,py-4-pulse*2,1,1,'#d4cf9b');}
 }
 c.restore();
}
export function drawEnemyImpact(c,x,y,r,age,{reduced=false,color='#eab18a',opacity=1}={}){
 if(!(r>0)||age<0||age>=1)return;c.save();disk(c,x,y,r);c.globalAlpha*=opacity*(1-age);
 const rr=r*(.12+age*.68);for(let i=0;i<(reduced?4:10);i++){const a=i*2.4,rad=rr*(.55+(i%3)*.15),px=x+Math.cos(a)*rad,py=y+Math.sin(a)*rad*.72;dot(c,px-2,py,4,2,'#302e33');dot(c,px-1,py-1,3,1,i%3?color:'#f6dfb5');}
 if(age<.3){c.globalAlpha*=.7;dot(c,x-5,y-1,10,2,'#f6e3bc');dot(c,x-1,y-4,2,8,color);}c.restore();
}
export function drawEnemySector(c,x,y,r,aim,halfAngle,{warning=false,progress=0,fade=1,reduced=false,accent='#d7907e'}={}){
 c.save();c.translate(x,y);c.rotate(aim);c.setLineDash([]);c.lineCap='butt';c.beginPath();c.moveTo(0,0);c.arc(0,0,r,-halfAngle,halfAngle);c.closePath();c.clip();
 if(warning){c.strokeStyle='#edb092';c.lineWidth=1.3;for(let i=0;i<7;i++){const a=-halfAngle+(i+.5)*halfAngle*2/7;c.beginPath();c.arc(0,0,r-1,a-.06,a+.06);c.stroke();}c.globalAlpha*=.1+clamp(progress)*.1;c.fillStyle='#d78673';c.beginPath();c.moveTo(0,0);c.arc(0,0,r,-halfAngle,halfAngle);c.closePath();c.fill();}
 else{c.globalAlpha*=fade;c.fillStyle='#e1a58a14';c.fill();c.fillStyle=accent;c.beginPath();c.arc(0,0,r-1,-halfAngle,halfAngle);c.arc(0,0,r*.72,halfAngle,-halfAngle,true);c.closePath();c.fill();c.strokeStyle='#fff0d9';c.lineWidth=2;c.beginPath();c.arc(0,0,r-2,-halfAngle+.03,halfAngle-.03);c.stroke();if(!reduced)for(let i=0;i<3;i++){const a=-halfAngle+(i+.5)*halfAngle*2/3;dot(c,Math.cos(a)*r*.82,Math.sin(a)*r*.82,2,1,'#ffe2bb');}}
 c.restore();
}
export function drawEnemyBeam(c,a,b,{active=false,width=30,color='#ed9988',progress=0,reduced=false}={}){
 const length=Math.hypot(b.x-a.x,b.y-a.y);if(!length)return;c.save();const alpha=c.globalAlpha;c.translate(a.x,a.y);c.rotate(Math.atan2(b.y-a.y,b.x-a.x));c.lineCap='butt';c.beginPath();c.rect(0,-width/2,length,width);c.clip();
 if(active){c.setLineDash([]);c.strokeStyle='#28212e';c.lineWidth=width;c.beginPath();c.moveTo(0,0);c.lineTo(length,0);c.stroke();c.strokeStyle=color;c.lineWidth=Math.max(2,width*.6);c.globalAlpha*=.75;c.stroke();c.globalAlpha=alpha;c.strokeStyle='#fff0df';c.lineWidth=2;c.stroke();if(!reduced)for(let x=12;x<length;x+=64)dot(c,x,-2,3,4,'#fff3dc');}
 else{c.strokeStyle=color;c.lineWidth=1;c.globalAlpha*=.38+.36*clamp(progress);c.setLineDash([3,6]);c.beginPath();c.moveTo(0,0);c.lineTo(length,0);c.stroke();}
 c.restore();
}
export function drawEnemyMuzzle(c,x,y,aim,{active=false,progress=0,reduced=false}={}){
 c.save();c.translate(x,y);c.rotate(aim);c.globalAlpha*=active?.72:.25+.35*clamp(progress);dot(c,-2,-1,5,2,active?'#fff0d5':'#db9c81');if(active&&!reduced){dot(c,1,-4,1,7,'#f2b18c');dot(c,4,-1,2,1,'#edb394');}c.restore();
}

// Renderer-only phase history. First observation/load does not replay a landing/beam ending.
const landings=new WeakMap(),beams=new WeakMap(),grounds=new WeakMap();let groundRoom;
export function drawEnemyLanding(c,e,time,{air,recover,radius,reduced=false}={}){
 let h=landings.get(e);if(!h||time<h.time){landings.set(e,{air,time,impact:-Infinity});return;}
 if(time!==h.time){if(h.air&&recover)h.impact=time;h.air=air;h.time=time;}
 drawEnemyImpact(c,e.x,e.y,radius,(time-h.impact)/.24,{reduced});
}
export function drawEnemyBeamEnding(c,e,end,time,reduced=false){
 const active=e.phase==='beam';let h=beams.get(e);if(!h||time<h.time){beams.set(e,{time,active,end:{...end},from:{x:e.x,y:e.y},fade:-Infinity});return;}
 if(time!==h.time){if(h.active&&!active)h.fade=time;if(active){h.end={...end};h.from={x:e.x,y:e.y};}h.active=active;h.time=time;}
 const age=(time-h.fade)/.16;if(active||reduced||age<0||age>=1)return;const length=Math.hypot(h.end.x-h.from.x,h.end.y-h.from.y);c.save();c.translate(h.from.x,h.from.y);c.rotate(Math.atan2(h.end.y-h.from.y,h.end.x-h.from.x));c.strokeStyle='#a57f8a';c.globalAlpha*=.2*(1-age);c.lineWidth=1;c.setLineDash([3,12]);c.beginPath();c.moveTo(0,0);c.lineTo(length,0);c.stroke();c.restore();
}
export function drawEnemyGroundTransitions(c,s,r,reduced=false){
 const time=s.elapsed;if(groundRoom!==r){groundRoom=r;grounds.delete(r);}let h=grounds.get(r);if(!h||time<h.time){h={time,live:new Map((r.hazards||[]).map(z=>[z,{x:z.x,y:z.y,r:z.r,phase:z.phase}])),fades:[]};grounds.set(r,h);return;}
 if(time!==h.time){const next=new Map();for(const z of r.hazards||[])next.set(z,{x:z.x,y:z.y,r:z.r,phase:z.phase});for(const [z,old] of h.live)if(!next.has(z)&&old.phase==='active')h.fades.push({...old,at:time});h.live=next;h.fades=h.fades.filter(f=>time-f.at<.22).slice(-12);h.time=time;}
 if(reduced)return;for(const f of h.fades){const age=(time-f.at)/.22;c.save();disk(c,f.x,f.y,f.r);c.globalAlpha*=.13*(1-age);for(let i=0;i<4;i++){const a=i*2.4,rr=f.r*.5;dot(c,f.x+Math.cos(a)*rr,f.y+Math.sin(a)*rr-age*4,3,1,'#a28aab');}c.restore();}
}
