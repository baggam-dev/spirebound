import {drawSoftField} from '../rendering/ground-visuals.js';
import {drawGroundField} from '../rendering/ground-visuals.js';
import {frostAttackRate} from './frost.js';
import {openGuard,warningCount} from './tactics.js';
import {segmentBlocked} from '../world/terrain.js';
import {emitShot} from './patterns.js';
export const eliteNames={explosive:'폭발 정예',guardian:'수호 정예',volley:'포화 정예'};
export function promoteElite(e,kind){if(e.elite||e.type==='boss')return;e.elite=kind;e.hp=e.max=Math.ceil(e.max*1.4);e.eliteCooldown=3;}
export function updateElites(room,dt,bullets,player){
 for(const e of room.enemies)e.protected=false;
 for(const e of room.enemies){if(!e.elite||e.hp<=0||e.spawnGrace>0||e.frozen>0||e.opening>0)continue;e.eliteCooldown=(e.eliteCooldown||0)-dt*frostAttackRate(e);
  if(e.elite==='guardian')for(const n of room.enemies)if(n!==e&&n.hp>0&&Math.hypot(n.x-e.x,n.y-e.y)<140)n.protected=true;
  if(e.elite==='volley'){
   if(e.eliteWarning>0){e.eliteWarning-=dt;if(e.eliteWarning<=0){e.eliteWarning=0;for(let i=-1;i<=1;i++)emitShot(e,e.eliteAim+i*.18,180,bullets);e.eliteCooldown=3;openGuard(e,1.25);}}
   else if(e.eliteCooldown<=0&&warningCount(room,e)<2){e.eliteWarning=.8;e.eliteAim=Math.atan2(player.y-e.y,player.x-e.x);}
  }
 }
}
export function eliteDeath(e,room){if(!e.elite)return false;if(e.elite==='explosive')(room.blasts??=[]).push({x:e.x,y:e.y,r:85,time:1,damage:e.trialChampion?9:18});return true;}
export function tickBlasts(room,dt,p,hurt,effects=[]){for(const b of room.blasts||[]){b.time-=dt;if(b.time<=0)effects.push({x:b.x,y:b.y,r:b.r,t:.6,color:'#f1a17c',groundBurst:true});if(b.time<=0&&Math.hypot(p.x-b.x,p.y-b.y)<b.r+10&&!segmentBlocked(b,p,room.obstacles))hurt(b.damage);}room.blasts=(room.blasts||[]).filter(b=>b.time>0);}
export function drawElites(ctx,room){ctx.save();ctx.font='10px Galmuri, monospace';ctx.textAlign='center';for(const e of room.enemies){if(e.elite){ctx.strokeStyle='#e9c278';ctx.lineWidth=2;drawSoftField(ctx,e.x,e.y,30,'#e9c278',.45);ctx.fillStyle='#efd593';ctx.fillText(eliteNames[e.elite],e.x,e.y-40);}if(e.protected){drawSoftField(ctx,e.x,e.y-3,32,'#8cc9ed',.32);ctx.fillStyle='#a6d5ebaa';ctx.fillRect(e.x-2,e.y-32,4,3);ctx.fillRect(e.x-5,e.y-29,10,2);ctx.fillRect(e.x-4,e.y-27,8,3);ctx.fillRect(e.x-2,e.y-24,4,2);}if(e.eliteWarning){ctx.strokeStyle=e.eliteWarning<.25?'#edaa7ebb':'#edaa7e80';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+Math.cos(e.eliteAim)*180,e.y+Math.sin(e.eliteAim)*180);ctx.stroke();}}for(const b of room.blasts||[]){drawGroundField(ctx,b,'blast');}ctx.restore();}
