import {ENEMY_COOLDOWN_FACTOR,attackProfile} from './balance.js';
import {segmentBlocked,steering,moveBody} from './terrain.js';

export function beamEnd(e,obstacles=[]){
 const direction={x:Math.cos(e.aim),y:Math.sin(e.aim)};
 let length=1400;
 if(direction.x>1e-8)length=Math.min(length,(932-e.x)/direction.x);
 if(direction.x< -1e-8)length=Math.min(length,(28-e.x)/direction.x);
 if(direction.y>1e-8)length=Math.min(length,(497-e.y)/direction.y);
 if(direction.y< -1e-8)length=Math.min(length,(43-e.y)/direction.y);
 const point=t=>({x:e.x+direction.x*t,y:e.y+direction.y*t});
 if(segmentBlocked(e,point(length),obstacles,4)){let low=0,high=length;for(let i=0;i<20;i++){const mid=(low+high)/2;if(segmentBlocked(e,point(mid),obstacles,4))high=mid;else low=mid;}length=low;}
 return point(Math.max(0,length));
}
export function lineDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t);}

// Telegraphs and active beams are part of the saved enemy state.
export function updateRanged(e,p,obstacles,dt,bullets,enraged=false){
 if(e.phase){
  e.phaseTime-=dt;
  if(e.phaseTime<=0){
   if(e.phase==='aim'){
    if(e.type==='laser'){e.phase='beam';e.phaseTime=.35;}
    else{const profile=attackProfile(e),count=2+Math.floor(profile.count/2);for(let i=0;i<count;i++){const a=e.aim+(i-(count-1)/2)*.16;bullets.push({x:e.x,y:e.y,vx:Math.cos(a)*330*profile.speed,vy:Math.sin(a)*330*profile.speed,enemy:true,source:'반사 사수 반사탄',ricochet:true,bounces:1,life:5,hit:[]});}e.phase=null;e.cd=(enraged?2.5:3.5)*ENEMY_COOLDOWN_FACTOR*profile.recovery;}
   }else{e.phase=null;e.cd=(enraged?3:4)*ENEMY_COOLDOWN_FACTOR*attackProfile(e).recovery;}
  }
  if(e.phase==='beam'&&!e.beamHit&&lineDistance(p,e,beamEnd(e,obstacles))<29&&!segmentBlocked(e,p,obstacles,4)){e.beamHit=true;return 18;}
  return 0;
 }
 e.cd=(e.cd??2)-dt;
 if(e.cd<=0){e.phase='aim';e.phaseTime=e.type==='laser'?1.2:.8;e.aim=Math.atan2(p.y-e.y,p.x-e.x);e.beamHit=false;return 0;}
 if(Math.hypot(p.x-e.x,p.y-e.y)>290||segmentBlocked(e,p,obstacles,4)){const a=steering(e,p,obstacles),speed=30*(e.slow>0?e.slowFactor:1);moveBody(e,Math.cos(a)*speed*dt,Math.sin(a)*speed*dt,obstacles,18);}
 return 0;
}

// Small swept steps prevent fast rounds crossing cover or the player between frames.
export function advanceRicochet(b,dt,obstacles,p){
 b.life-=dt;if(b.life<=0)return false;
 const steps=Math.max(1,Math.ceil(Math.hypot(b.vx,b.vy)*dt/4));
 for(let i=0;i<steps;i++){
  const next={x:b.x+b.vx*dt/steps,y:b.y+b.vy*dt/steps};
  if(segmentBlocked(b,next,obstacles,4)){b.life=0;return false;}
  const wallX=next.x<=29||next.x>=931,wallY=next.y<=44||next.y>=496;
  if(wallX||wallY){if(b.bounces<=0){b.life=0;return false;}b.bounces--;if(wallX){b.vx=-b.vx;next.x=next.x<=29?58-next.x:1862-next.x;}if(wallY){b.vy=-b.vy;next.y=next.y<=44?88-next.y:992-next.y;}}
  if(lineDistance(p,b,next)<18){b.life=0;return true;}
  b.x=next.x;b.y=next.y;
 }
 return false;
}
export function drawRanged(ctx,e,obstacles){
 if(e.type!=='laser'&&e.type!=='ricochet')return;
 const color=e.escapeDepth?'#ff9198':e.type==='laser'?'#f2a0cb':'#74e1dd';
 ctx.fillStyle=e.escapeDepth?'#9e424f':'#353e50';ctx.fillRect(e.x-18,e.y-22,36,35);ctx.fillStyle=color;
 if(e.type==='laser'){ctx.fillRect(e.x-6,e.y-32,12,23);ctx.fillStyle='#f9e6f3';ctx.fillRect(e.x-3,e.y-27,6,10);}
 else{ctx.strokeStyle=color;ctx.lineWidth=4;ctx.beginPath();ctx.arc(e.x,e.y-7,16,0,Math.PI*2);ctx.stroke();ctx.fillRect(e.x-5,e.y-12,10,10);}
 ctx.fillStyle='#101824';ctx.fillRect(e.x-18,e.y+8,36,5);ctx.fillStyle='#b8bac077';ctx.fillRect(e.x-17,e.y-21,34,2);ctx.fillRect(e.x-14,e.y-15,3,19);ctx.fillRect(e.x+11,e.y-15,3,19);ctx.fillStyle=color;ctx.fillRect(e.x-11,e.y+2,4,3);ctx.fillRect(e.x+7,e.y+2,4,3);
 if(!e.phase)return;
 const end=beamEnd(e,obstacles);ctx.save();ctx.strokeStyle=color;ctx.lineWidth=e.phase==='beam'?30:3;ctx.setLineDash(e.phase==='aim'?[8,6]:[]);ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(end.x,end.y);ctx.stroke();
 if(e.phase==='beam'){ctx.strokeStyle='#fff0f8';ctx.lineWidth=2;ctx.stroke();}ctx.restore();
}
