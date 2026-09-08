import {moveBody,steering,safeSpawn,segmentBlocked} from './terrain.js';
export const bossPatterns=['ring','slam','fan','spiral'];
export function emitShot(e,angle,speed,bullets){bullets.push({x:e.x,y:e.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,enemy:true,life:4,hit:[]});}
function recover(e,seconds){e.attackPhase='recover';e.attackTime=seconds;}
export function updatePattern(e,p,obstacles,dt,bullets,enraged=false){
 if(e.hp<=0)return 0;
 if(!e.attackPhase){
  e.cd=(e.cd??2)-dt;
  if(e.cd>0){const speed=(e.type==='boss'?25:25)*(e.slow>0?e.slowFactor:1),a=steering(e,p,obstacles,e.type==='boss'?32:18);if(e.type==='boss'||Math.hypot(p.x-e.x,p.y-e.y)>270||segmentBlocked(e,p,obstacles,3))moveBody(e,Math.cos(a)*speed*dt,Math.sin(a)*speed*dt,obstacles,e.type==='boss'?32:18);return 0;}
  e.pattern=e.type==='boss'?bossPatterns[(e.patternIndex??0)%4]:e.type==='archer'?'burst':'stagger';e.patternIndex=(e.patternIndex??0)+1;
  e.attackPhase='warning';e.attackTime=e.pattern==='slam'?1.1:e.type==='boss'?.9:.7;e.patternAim=Math.atan2(p.y-e.y,p.x-e.x);
  if(e.pattern==='slam'){const d=Math.hypot(p.x-e.x,p.y-e.y)||1,n=Math.min(d,220),landing={x:e.x+(p.x-e.x)*n/d,y:e.y+(p.y-e.y)*n/d};landing.x=Math.max(75,Math.min(885,landing.x));landing.y=Math.max(85,Math.min(455,landing.y));safeSpawn(landing,obstacles,32);e.targetX=landing.x;e.targetY=landing.y;}
  return 0;
 }
 e.attackTime-=dt;
 if(e.attackPhase==='warning'&&e.attackTime<=0){
  if(e.pattern==='slam'){e.attackPhase='leap';e.attackTime=.5;e.fromX=e.x;e.fromY=e.y;return 0;}
  e.attackPhase='firing';e.attackTime=0;e.shot=0;
 }
 if(e.attackPhase==='leap'){
  const t=1-Math.max(0,e.attackTime)/.5;e.x=e.fromX+(e.targetX-e.fromX)*t;e.y=e.fromY+(e.targetY-e.fromY)*t;
  if(e.attackTime<=0){recover(e,1.5);return Math.hypot(p.x-e.x,p.y-e.y)<85&&!segmentBlocked(e,p,obstacles,0)?24:0;}return 0;
 }
 if(e.attackPhase==='firing'&&e.attackTime<=0){
  const n=e.shot++;
  if(e.pattern==='ring'){for(let i=0;i<12;i++)emitShot(e,e.patternAim+i*Math.PI/6,145,bullets);recover(e,1.4);}
  if(e.pattern==='fan'){for(let i=-2;i<=2;i++)emitShot(e,e.patternAim+i*.2+(n%2?.1:0),180,bullets);e.attackTime=.4;if(e.shot>=2)recover(e,1.5);}
  if(e.pattern==='spiral'){for(let i=0;i<4;i++)emitShot(e,e.patternAim+i*Math.PI/2+n*.19,135,bullets);e.attackTime=.3;if(e.shot>=5)recover(e,1.8);}
  if(e.pattern==='burst'){emitShot(e,e.patternAim,190,bullets);e.attackTime=.22;if(e.shot>=3)recover(e,enraged?1.7:2.4);}
  if(e.pattern==='stagger'){for(let i=-1;i<=1;i++)emitShot(e,e.patternAim+i*.35+(n?.17:0),160,bullets);e.attackTime=.4;if(e.shot>=2)recover(e,enraged?2:2.8);}
  return 0;
 }
 if(e.attackPhase==='recover'&&e.attackTime<=0){e.attackPhase=null;e.cd=e.type==='boss'?.6:.5;}
 return 0;
}
export function drawPattern(ctx,e){
 if(!e.attackPhase)return;
 ctx.save();ctx.lineWidth=2;
 if(e.pattern==='slam'&&['warning','leap'].includes(e.attackPhase)){ctx.fillStyle='#eead6422';ctx.strokeStyle='#f1b76c';ctx.beginPath();ctx.arc(e.targetX,e.targetY,85,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(e.targetX-10,e.targetY);ctx.lineTo(e.targetX+10,e.targetY);ctx.moveTo(e.targetX,e.targetY-10);ctx.lineTo(e.targetX,e.targetY+10);ctx.stroke();}
 else if(e.attackPhase==='warning'){ctx.strokeStyle=e.type==='boss'?'#f1b76c':'#dcaa84';ctx.setLineDash([6,5]);const count=e.pattern==='spiral'?4:e.pattern==='ring'?12:1;for(let i=0;i<count;i++){const a=e.patternAim+i*Math.PI*2/count;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+Math.cos(a)*100,e.y+Math.sin(a)*100);ctx.stroke();}}
 if(e.type==='boss'){ctx.setLineDash([]);ctx.font='11px sans-serif';ctx.textAlign='center';ctx.fillStyle=e.attackPhase==='recover'?'#a8d5b1':'#efd7a4';ctx.fillText(e.attackPhase==='recover'?'빈틈!':({ring:'원형 탄막',slam:'내려찍기',fan:'교차 부채꼴',spiral:'회전 탄막'})[e.pattern],e.x,e.y-57);}
 ctx.restore();
}
