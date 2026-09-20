import {openGuard} from './tactics.js';
import {enemyName} from './expedition.js';
import {ENEMY_COOLDOWN_FACTOR,attackProfile} from './balance.js';
import {moveBody,steering,safeSpawn,segmentBlocked} from './terrain.js';
export const bossPatterns=['ring','slam','fan','spiral','cross','pincer'];
export function emitShot(e,angle,speed,bullets){speed*=attackProfile(e).speed;bullets.push({x:e.x,y:e.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,enemy:true,source:enemyName(e)+(e.elite?' 정예탄':' 탄환'),damage:e.trialChampion?9:e.escapeDepth>=4?12:10,life:4,hit:[]});}
function recover(e,seconds){e.attackPhase='recover';e.attackTime=seconds*(e.type==='boss'?.4:ENEMY_COOLDOWN_FACTOR*attackProfile(e).recovery);}
export function updatePattern(e,p,obstacles,dt,bullets,enraged=false){
 if(e.hp<=0)return 0;
 if(!e.attackPhase){
  e.cd=(e.cd??2)-dt;
  if(e.cd>0){const speed=(e.type==='boss'?40:25)*(e.slow>0?e.slowFactor:1),a=steering(e,p,obstacles,e.type==='boss'?32:18);if(e.type==='boss'||Math.hypot(p.x-e.x,p.y-e.y)>270||segmentBlocked(e,p,obstacles,3))moveBody(e,Math.cos(a)*speed*dt,Math.sin(a)*speed*dt,obstacles,e.type==='boss'?32:18);return 0;}
  e.pattern=e.type==='boss'?bossPatterns[(e.patternIndex??0)%bossPatterns.length]:e.type==='archer'?'burst':'stagger';e.patternIndex=(e.patternIndex??0)+1;
  e.attackPhase='warning';e.attackTime=e.pattern==='slam'?1.1:e.type==='boss'?.65:.7;e.patternAim=Math.atan2(p.y-e.y,p.x-e.x);
  if(e.pattern==='slam'){const d=Math.hypot(p.x-e.x,p.y-e.y)||1,n=Math.min(d,220),landing={x:e.x+(p.x-e.x)*n/d,y:e.y+(p.y-e.y)*n/d};landing.x=Math.max(75,Math.min(885,landing.x));landing.y=Math.max(85,Math.min(455,landing.y));safeSpawn(landing,obstacles,32);e.targetX=landing.x;e.targetY=landing.y;}
  return 0;
 }
 if(e.type==='boss'&&e.attackPhase==='recover'){const a=steering(e,p,obstacles,32);moveBody(e,Math.cos(a)*40*dt,Math.sin(a)*40*dt,obstacles,32);}
 e.attackTime-=dt;
 if(e.attackPhase==='warning'&&e.attackTime<=0){
  if(e.pattern==='slam'){e.attackPhase='leap';e.attackTime=.5;e.fromX=e.x;e.fromY=e.y;return 0;}
  e.attackPhase='firing';e.attackTime=0;e.shot=0;
 }
 if(e.attackPhase==='leap'){
  const t=1-Math.max(0,e.attackTime)/.5;e.x=e.fromX+(e.targetX-e.fromX)*t;e.y=e.fromY+(e.targetY-e.fromY)*t;
  if(e.attackTime<=0){recover(e,1.5);openGuard(e,1.2);return Math.hypot(p.x-e.x,p.y-e.y)<85&&!segmentBlocked(e,p,obstacles,0)?24:0;}return 0;
 }
 if(e.attackPhase==='firing'&&e.attackTime<=0){
  const n=e.shot++;
  if(e.pattern==='pincer'){for(let side of [-1,1])for(let i=-2;i<=2;i++)emitShot(e,e.patternAim+side*(.6-n*.18)+i*.07,210,bullets);e.attackTime=.25;if(e.shot>=4)recover(e,1.6);}
  if(e.pattern==='ring'){for(let i=0;i<26;i++)emitShot(e,e.patternAim+i*Math.PI*2/26,145,bullets);recover(e,1.4);}
  if(e.pattern==='fan'){for(let i=-5;i<=5;i++)emitShot(e,e.patternAim+i*.12+(n%2?.06:0),180,bullets);e.attackTime=.2;if(e.shot>=2)recover(e,1.5);}
  if(e.pattern==='spiral'){for(let i=0;i<8;i++)emitShot(e,e.patternAim+i*Math.PI/4+n*.19,135,bullets);e.attackTime=.15;if(e.shot>=6)recover(e,1.8);}
  if(e.pattern==='cross'){for(let i=0;i<4;i++)for(let j=-2;j<=2;j++)emitShot(e,e.patternAim+i*Math.PI/2+j*.1+n*.14,200,bullets);e.attackTime=.25;if(e.shot>=3)recover(e,1.8);}
  if(e.pattern==='burst'){const upper=e.tier>=6;emitShot(e,e.patternAim,upper?230:190,bullets);e.attackTime=upper?.16:.22;if(e.shot>=5+attackProfile(e).count)recover(e,upper?1.7:enraged?1.7:2.4);}
  if(e.pattern==='stagger'){for(let i=-2-attackProfile(e).count;i<=2+attackProfile(e).count;i++)emitShot(e,e.patternAim+i*.22+(n?.17:0),160,bullets);e.attackTime=.4;if(e.shot>=2)recover(e,enraged?2:2.8);}
  return 0;
 }
 if(e.attackPhase==='recover'&&e.attackTime<=0){e.attackPhase=null;e.cd=e.type==='boss'?.24:.5*ENEMY_COOLDOWN_FACTOR;}
 return 0;
}
export function drawPattern(ctx,e){
 if(!e.attackPhase||!e.pattern)return;
 ctx.save();ctx.lineWidth=2;
 if(e.pattern==='slam'&&['warning','leap'].includes(e.attackPhase)){ctx.fillStyle='#eead6422';ctx.strokeStyle='#f1b76c';ctx.beginPath();ctx.arc(e.targetX,e.targetY,85,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(e.targetX-10,e.targetY);ctx.lineTo(e.targetX+10,e.targetY);ctx.moveTo(e.targetX,e.targetY-10);ctx.lineTo(e.targetX,e.targetY+10);ctx.stroke();}
 else if(e.attackPhase==='warning'){ctx.strokeStyle=e.type==='boss'?'#f1b76c':'#dcaa84';ctx.setLineDash([6,5]);const count=e.pattern==='spiral'?4:e.pattern==='ring'?12:1;for(let i=0;i<count;i++){const a=e.patternAim+i*Math.PI*2/count;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+Math.cos(a)*100,e.y+Math.sin(a)*100);ctx.stroke();}}
 if(e.type==='boss'){ctx.setLineDash([]);ctx.font='11px sans-serif';ctx.textAlign='center';ctx.fillStyle=e.attackPhase==='recover'?'#a8d5b1':'#efd7a4';ctx.fillText(e.attackPhase==='recover'?'빈틈!':({ring:'원형 탄막',slam:'내려찍기',fan:'교차 부채꼴',spiral:'회전 탄막',cross:'회전 십자포화',pincer:'협공 탄막'})[e.pattern],e.x,e.y-57);}
 ctx.restore();
}
