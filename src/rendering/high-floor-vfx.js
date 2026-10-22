import {highShapes} from '../combat/high-floor-profile.js';
import {highStepEnd} from '../combat/high-floor-patterns.js';
import {segmentBlocked} from '../world/terrain.js';
const TAU=Math.PI*2;
function line(c,x,y,aim,length,obstacles){if(obstacles){const end=d=>({x:x+Math.cos(aim)*d,y:y+Math.sin(aim)*d});if(segmentBlocked({x,y},end(length),obstacles,4)){let lo=0,hi=length;for(let i=0;i<12;i++){const mid=(lo+hi)/2;if(segmentBlocked({x,y},end(mid),obstacles,4))hi=mid;else lo=mid;}length=lo;}}c.moveTo(x,y);c.lineTo(x+Math.cos(aim)*length,y+Math.sin(aim)*length);}
function portal(c,x,y,r=21){c.beginPath();c.ellipse(x,y,r,r*.55,0,0,TAU);c.stroke();for(let i=0;i<4;i++){const a=i*Math.PI/2;c.fillRect(x+Math.cos(a)*r-1,y+Math.sin(a)*r*.55-1,2,2);}}
function shape(c,e,a,room,active,reduced){
 const s=highShapes[a.kind],amber='#e6b37e';c.strokeStyle=active?'#e4c8ff':amber;c.fillStyle=active?'#b385dc18':'#d9a0610b';c.lineWidth=active?2.5:1.2;c.setLineDash(active?[]:[5,4]);
 if(s){let x=e.x,y=e.y;if(a.kind==='soldier'&&a.stage==='windup'){const q=highStepEnd(e,a.aim,24,room.obstacles);x=q.x;y=q.y;c.beginPath();line(c,e.x,e.y,a.aim,Math.hypot(q.x-e.x,q.y-e.y));c.stroke();}
  c.save();c.translate(x,y);c.rotate(a.aim);c.beginPath();
  if(s.width){c.roundRect(-s.width,-s.width,s.range+s.width*2,s.width*2,s.width);}
  else{c.moveTo(0,0);c.arc(0,0,s.range,-s.half,s.half);c.closePath();}c.fill();c.stroke();
  if(active){c.setLineDash([]);c.strokeStyle='#fff2ff';c.lineWidth=1.5;c.beginPath();if(s.width){c.moveTo(0,0);c.lineTo(s.range,0);}else c.arc(0,0,s.range*.78,-s.half,s.half);c.stroke();}c.restore();return;
 }
 if(a.kind==='twoShot'){for(let i=0;i<2;i++){c.globalAlpha=i<a.step?.15:i===a.step?.8:.35;c.beginPath();const x=i?a.secondX:a.tx,y=i?a.secondY:a.ty;line(c,e.x,e.y,Math.atan2(y-e.y,x-e.x),Math.hypot(x-e.x,y-e.y),room.obstacles);c.stroke();portal(c,x,y,7);}return;}
 if(a.kind==='cross'){for(let beat=0;beat<2;beat++){c.globalAlpha=beat<a.step?.12:beat===a.step?.72:.24;for(let i=0;i<4;i++){c.beginPath();line(c,e.x,e.y,a.aim+beat*Math.PI/4+i*Math.PI/2,480,room.obstacles);c.stroke();}}return;}
 if(a.kind==='gravity'){c.strokeStyle=a.stage==='channel'?'#c2a3e2':amber;c.setLineDash(a.stage==='channel'?[]:[5,4]);c.beginPath();c.arc(a.tx,a.ty,90,0,TAU);c.stroke();if(a.stage==='channel')for(let i=0;i<(reduced?3:6);i++){const theta=i*TAU/(reduced?3:6),r=reduced?50:20+(a.time/.8*60);c.fillStyle='#c8a5dc';c.fillRect(a.tx+Math.cos(theta)*r,a.ty+Math.sin(theta)*r,2,2);}return;}
 if(a.kind==='resonate'){c.globalAlpha=.35;c.strokeStyle='#d2b478';c.beginPath();c.arc(e.x,e.y,170,0,TAU);c.stroke();for(const n of room.enemies)if(n!==e&&n.hp>0&&Math.hypot(n.x-e.x,n.y-e.y)<170){c.beginPath();c.moveTo(e.x,e.y);c.lineTo(n.x,n.y);c.stroke();}return;}
}
export function drawHighFloorGround(c,e,room,{reduced=false}={}){
 if(e.hp<=0)return;const a=e.highAttack,f=e.highFlash;if(!a&&!f)return;
 c.save();c.beginPath();c.rect(25,45,910,455);c.clip();c.globalAlpha=.8;
 if(f&&(!a||a.stage==='recover')){c.save();c.globalAlpha=.65*f.time/.18;shape(c,e,f,room,true,reduced);c.restore();}
 if(a&&a.stage!=='recover'){
  if(a.kind==='rift'){
   c.strokeStyle='#ba91da';c.fillStyle='#c3a2e7';c.lineWidth=1.5;c.setLineDash([4,4]);portal(c,a.homeX,a.homeY);portal(c,a.tx,a.ty);
   if(['windup2','strike'].includes(a.stage))shape(c,e,a,room,a.stage==='strike',reduced);
  }else if(a.kind==='captain'&&['windup','dash'].includes(a.stage)&&!a.close){c.strokeStyle='#e6b37e';c.lineWidth=1.3;c.setLineDash(a.stage==='dash'?[]:[5,4]);c.save();c.translate(a.x,a.y);c.rotate(Math.atan2(a.ty-a.y,a.tx-a.x));c.beginPath();c.roundRect(-40,-40,Math.hypot(a.tx-a.x,a.ty-a.y)+80,80,40);c.stroke();c.restore();}
  else shape(c,e,a,room,a.stage==='strike'||a.stage==='channel',reduced);
 }
 if(a?.stage==='recover'){c.fillStyle='#b7d6bd';c.font='10px Galmuri, monospace';c.textAlign='center';c.fillText('빈틈',e.x,e.y-44);}
 c.restore();
}
