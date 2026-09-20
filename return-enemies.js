import {moveBody,steering,safeSpawn,segmentBlocked} from './terrain.js';
import {attackProfile} from './balance.js';

export const returnEnemyTypes=['strafer','ringcaster','ambusher'];
function shot(e,a,speed,bullets){const p=attackProfile(e);bullets.push({x:e.x,y:e.y,vx:Math.cos(a)*speed*p.speed,vy:Math.sin(a)*speed*p.speed,enemy:true,damage:e.escapeDepth>=4?12:10,source:e.type==='strafer'?'횡단 사수 평행탄':'고리술사 고리탄',life:4,hit:[]});}
export function updateReturnEnemy(e,p,obstacles,dt,bullets){
 const factor=e.slow>0?e.slowFactor:1;
 if(e.attackPhase){e.attackTime-=dt;
  if(e.attackPhase==='warning'&&e.attackTime<=0){
   if(e.type==='ambusher'){e.attackPhase='dash';e.attackTime=.38;}
   else{if(e.type==='strafer')for(let i=-1;i<=1;i++){const x=e.x,y=e.y;e.x+=Math.cos(e.aim+Math.PI/2)*i*20;e.y+=Math.sin(e.aim+Math.PI/2)*i*20;shot(e,e.aim,170,bullets);e.x=x;e.y=y;}
    else for(let i=2;i<16;i++)shot(e,e.aim+i*Math.PI*2/16,115,bullets);
    e.attackPhase='recover';e.attackTime=e.type==='strafer'?1.25:2.4;
   }
  }
  if(e.attackPhase==='dash'){moveBody(e,Math.cos(e.aim)*340*factor*dt,Math.sin(e.aim)*340*factor*dt,obstacles,19);e.x=Math.max(45,Math.min(915,e.x));e.y=Math.max(60,Math.min(480,e.y));if(Math.hypot(e.x-p.x,e.y-p.y)<27&&!segmentBlocked(e,p,obstacles)){if(!e.dashHit){e.dashHit=true;return 18;}}if(e.attackTime<=0){e.attackPhase='recover';e.attackTime=1.4;}}
  if(e.attackPhase==='recover'&&e.attackTime<=0){e.attackPhase=null;e.cd=.8;}return 0;
 }
 e.cd=(e.cd??1)-dt;
 if(e.type==='strafer'){const a=Math.atan2(p.y-e.y,p.x-e.x)+(e.id%2?1:-1)*Math.PI/2;moveBody(e,Math.cos(a)*55*factor*dt,Math.sin(a)*55*factor*dt,obstacles,19);}
 if(e.type==='ambusher'){const a=steering(e,p,obstacles,19);moveBody(e,Math.cos(a)*35*factor*dt,Math.sin(a)*35*factor*dt,obstacles,19);}
 e.x=Math.max(45,Math.min(915,e.x));e.y=Math.max(60,Math.min(480,e.y));
 if(e.cd<=0){e.aim=Math.atan2(p.y-e.y,p.x-e.x);e.attackPhase='warning';e.attackTime=e.type==='ambusher'?.85:.8;e.dashHit=false;}return 0;
}
export function drawReturnEnemy(ctx,e){
 if(!returnEnemyTypes.includes(e.type))return;ctx.save();ctx.fillStyle='#ee777c';ctx.strokeStyle='#ffb0b1';ctx.lineWidth=2;
 if(e.type==='strafer'){ctx.fillRect(e.x-19,e.y-16,5,26);ctx.fillRect(e.x+15,e.y-16,5,26);ctx.fillRect(e.x-12,e.y-26,24,5);}
 if(e.type==='ringcaster'){ctx.beginPath();ctx.arc(e.x,e.y-6,23,0,Math.PI*2);ctx.stroke();ctx.fillRect(e.x-4,e.y-29,8,10);}
 if(e.type==='ambusher'){ctx.beginPath();ctx.moveTo(e.x-19,e.y+15);ctx.lineTo(e.x,e.y-28);ctx.lineTo(e.x+19,e.y+15);ctx.closePath();ctx.stroke();}
 if(e.attackPhase==='warning'){ctx.setLineDash([5,5]);ctx.beginPath();if(e.type==='ringcaster')ctx.arc(e.x,e.y,65,e.aim+Math.PI/4,e.aim+Math.PI*2);else{ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+Math.cos(e.aim)*130,e.y+Math.sin(e.aim)*130);}ctx.stroke();}
 ctx.restore();
}
