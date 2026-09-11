import {openGuard} from './tactics.js';
import {emitShot} from './patterns.js';
import {beamEnd,lineDistance} from './ranged.js';
import {segmentBlocked} from './terrain.js';
export function updatePrism(e,p,obstacles,dt,bullets){
 if(!e.prismPhase){e.cd=(e.cd??2)-dt;if(e.cd>0)return 0;e.prismAttack=['bounce','laser','shards'][(e.prismTurn??0)%3];e.prismTurn=(e.prismTurn??0)+1;e.aim=Math.atan2(p.y-e.y,p.x-e.x);e.prismPhase='warning';e.prismTime=1.3;e.prismHit=false;return 0;}
 e.prismTime-=dt;
 if(e.prismPhase==='warning'&&e.prismTime<=0){
  if(e.prismAttack==='bounce'){for(let i=0;i<18;i++){const a=e.aim+i*Math.PI*2/18;bullets.push({x:e.x,y:e.y,vx:Math.cos(a)*280,vy:Math.sin(a)*240,enemy:true,source:'프리즘 반사 결정탄',ricochet:true,bounces:1,life:5,hit:[]});}e.prismPhase='recover';e.prismTime=1.4;}
  else if(e.prismAttack==='shards'){e.prismPhase='salvo';e.prismTime=0;e.prismShot=0;}
  else{e.prismPhase='beam';e.prismTime=.45;}
 }
 if(e.prismPhase==='salvo'&&e.prismTime<=0){for(let i=0;i<12;i++)emitShot(e,e.aim+i*Math.PI/6+e.prismShot*.14,240,bullets);e.prismShot++;e.prismTime=.3;if(e.prismShot>=3){e.prismPhase='recover';e.prismTime=1.2;}}
 if(e.prismPhase==='beam'){
  if(e.prismTime<=0){e.prismPhase='recover';e.prismTime=1;openGuard(e,1.2);return 0;}
  if(!e.prismHit&&!segmentBlocked(e,p,obstacles,4)&&[-.65,-.325,0,.325,.65].some(a=>lineDistance(p,e,beamEnd({...e,aim:e.aim+a},obstacles))<27)){e.prismHit=true;return 22;}
 }
 if(e.prismPhase==='recover'&&e.prismTime<=0){e.prismPhase=null;e.cd=.4;}
 return 0;
}
export function drawPrism(ctx,e,obstacles){
 ctx.save();ctx.save();ctx.translate(e.x,e.y);ctx.scale(e.scale??1,e.scale??1);ctx.translate(-e.x,-e.y);ctx.fillStyle='#665c8c';ctx.fillRect(e.x-26,e.y-27,52,45);ctx.fillStyle='#b9e5e4';ctx.beginPath();ctx.moveTo(e.x,e.y-40);ctx.lineTo(e.x+17,e.y-12);ctx.lineTo(e.x,e.y+8);ctx.lineTo(e.x-17,e.y-12);ctx.fill();ctx.restore();
 if(['warning','beam'].includes(e.prismPhase)){
  ctx.strokeStyle=e.prismAttack==='laser'?'#f3a3d1':'#7ae6df';ctx.lineWidth=e.prismPhase==='beam'?26:2;ctx.setLineDash(e.prismPhase==='warning'?[7,6]:[]);
  const angles=e.prismAttack==='laser'?[-.65,-.325,0,.325,.65]:Array.from({length:18},(_,i)=>i*Math.PI/4);
  for(const offset of angles){const a=e.aim+offset,end=e.prismAttack==='laser'?beamEnd({...e,aim:a},obstacles):{x:e.x+Math.cos(a)*120,y:e.y+Math.sin(a)*120};ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(end.x,end.y);ctx.stroke();}
 }
 ctx.font='11px sans-serif';ctx.textAlign='center';ctx.fillStyle='#ead9b5';ctx.fillText(e.prismPhase==='recover'?'빈틈!':e.prismAttack==='laser'?'오중 광선':e.prismAttack==='shards'?'회전 결정 연사':'반사 결정탄',e.x,e.y-55);ctx.restore();
}
