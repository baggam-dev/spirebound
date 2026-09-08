import {safeSpawn,steering,moveBody,segmentBlocked} from './terrain.js';
// All phase clocks live on the enemy so save/resume preserves attacks exactly.
export function updateBrute(e,p,obstacles,dt,enraged=false){
 e.jumpCooldown=Math.max(0,(e.jumpCooldown??4)-dt);
 if(e.phase){
  e.phaseTime-=dt;
  if(e.phase==='air'){const t=Math.min(1,1-Math.max(0,e.phaseTime)/.55);e.x=e.launchX+(e.landX-e.launchX)*t;e.y=e.launchY+(e.landY-e.launchY)*t;}
  if(e.phaseTime>0)return 0;
  if(e.phase==='windup'){e.phase='air';e.phaseTime=.55;e.launchX=e.x;e.launchY=e.y;return 0;}
  if(e.phase==='air'){e.x=e.landX;e.y=e.landY;e.phase='recover';e.phaseTime=1.1;e.jumpCooldown=6;return Math.hypot(p.x-e.x,p.y-e.y)<62&&!segmentBlocked(e,p,obstacles,0)?20:0;}
  if(e.phase==='swing'){e.phase='recover';e.phaseTime=.8;return Math.hypot(p.x-e.x,p.y-e.y)<55&&!segmentBlocked(e,p,obstacles,0)?16:0;}
  e.phase=null;return 0;
 }
 const distance=Math.hypot(p.x-e.x,p.y-e.y);
 if(distance<52&&!segmentBlocked(e,p,obstacles,0)){e.phase='swing';e.phaseTime=.6;return 0;}
 if(e.jumpCooldown<=0&&distance>90){const length=Math.min(distance,240),target={x:e.x+(p.x-e.x)*length/distance,y:e.y+(p.y-e.y)*length/distance};target.x=Math.max(60,Math.min(900,target.x));target.y=Math.max(80,Math.min(460,target.y));safeSpawn(target,obstacles,22);e.landX=target.x;e.landY=target.y;e.phase='windup';e.phaseTime=1;return 0;}
 const a=steering(e,p,obstacles,22),speed=32*(enraged?1.3:1)*(e.slow>0?e.slowFactor:1);moveBody(e,Math.cos(a)*speed*dt,Math.sin(a)*speed*dt,obstacles,22);return 0;
}
export function drawEnemyDetails(ctx,e){
 const x=Math.round(e.x),y=Math.round(e.y);const box=(dx,dy,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x+dx,y+dy,w,h);};
 if(e.type==='archer'){box(-13,-26,26,8,'#666186');box(14,-16,4,32,'#c9ad75');box(18,-10,3,20,'#88704a');}
 if(e.type==='charger'){box(-17,-27,7,18,'#d7caa4');box(10,-27,7,18,'#d7caa4');box(-15,-6,30,9,'#7d6853');}
 if(e.type==='scatter'){box(-18,-6,36,23,'#9b7050');box(-13,-3,26,6,'#dab87b');box(-9,5,6,6,'#272d28');box(3,5,6,6,'#272d28');}
 if(e.type==='chaser'){box(-15,-6,5,21,'#b7b99a');box(10,-6,5,21,'#b7b99a');box(-7,0,14,3,'#343f35');}
 if(e.type==='brute'){
  const lift=e.phase==='air'?Math.sin(Math.PI*(1-Math.max(0,e.phaseTime)/.55))*45:0;
  ctx.save();ctx.translate(0,-lift);box(-21,-13,42,33,'#73785c');box(-15,-30,30,24,'#a4a586');box(-24,-9,9,21,'#c3b794');box(15,-9,9,21,'#c3b794');box(-9,-21,5,5,'#e4ae70');box(5,-21,5,5,'#e4ae70');box(24,-7,5,31,'#886b44');box(18,-16,20,14,'#b5aa8d');ctx.restore();
  if(e.phase==='windup'||e.phase==='air'||e.phase==='swing'){const jumping=e.phase!=='swing';ctx.fillStyle='#de9c5328';ctx.strokeStyle='#f1b66e';ctx.lineWidth=2;ctx.beginPath();ctx.arc(jumping?e.landX:e.x,jumping?e.landY:e.y,jumping?62:55,0,Math.PI*2);ctx.fill();ctx.stroke();}
 }
}
