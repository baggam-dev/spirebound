import {beamEnd,lineDistance} from './ranged.js';
import {segmentBlocked} from './terrain.js';
export function updatePrism(e,p,obstacles,dt,bullets){
 if(!e.prismPhase){e.cd=(e.cd??2)-dt;if(e.cd>0)return 0;e.prismAttack=(e.prismTurn??0)%2?'laser':'bounce';e.prismTurn=(e.prismTurn??0)+1;e.aim=Math.atan2(p.y-e.y,p.x-e.x);e.prismPhase='warning';e.prismTime=1.3;e.prismHit=false;return 0;}
 e.prismTime-=dt;
 if(e.prismPhase==='warning'&&e.prismTime<=0){
  if(e.prismAttack==='bounce'){for(let i=0;i<8;i++){const a=e.aim+i*Math.PI/4;bullets.push({x:e.x,y:e.y,vx:Math.cos(a)*240,vy:Math.sin(a)*240,enemy:true,ricochet:true,bounces:1,life:5,hit:[]});}e.prismPhase='recover';e.prismTime=2.8;}
  else{e.prismPhase='beam';e.prismTime=.45;}
 }
 if(e.prismPhase==='beam'){
  if(e.prismTime<=0){e.prismPhase='recover';e.prismTime=2;return 0;}
  if(!e.prismHit&&!segmentBlocked(e,p,obstacles,4)&&[-.5,0,.5].some(a=>lineDistance(p,e,beamEnd({...e,aim:e.aim+a},obstacles))<18)){e.prismHit=true;return 22;}
 }
 if(e.prismPhase==='recover'&&e.prismTime<=0){e.prismPhase=null;e.cd=.8;}
 return 0;
}
export function drawPrism(ctx,e,obstacles){
 ctx.save();ctx.fillStyle='#665c8c';ctx.fillRect(e.x-26,e.y-27,52,45);ctx.fillStyle='#b9e5e4';ctx.beginPath();ctx.moveTo(e.x,e.y-40);ctx.lineTo(e.x+17,e.y-12);ctx.lineTo(e.x,e.y+8);ctx.lineTo(e.x-17,e.y-12);ctx.fill();
 if(['warning','beam'].includes(e.prismPhase)){
  ctx.strokeStyle=e.prismAttack==='laser'?'#f3a3d1':'#7ae6df';ctx.lineWidth=e.prismPhase==='beam'?8:2;ctx.setLineDash(e.prismPhase==='warning'?[7,6]:[]);
  const angles=e.prismAttack==='laser'?[-.5,0,.5]:Array.from({length:8},(_,i)=>i*Math.PI/4);
  for(const offset of angles){const a=e.aim+offset,end=e.prismAttack==='laser'?beamEnd({...e,aim:a},obstacles):{x:e.x+Math.cos(a)*120,y:e.y+Math.sin(a)*120};ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(end.x,end.y);ctx.stroke();}
 }
 ctx.font='11px sans-serif';ctx.textAlign='center';ctx.fillStyle='#ead9b5';ctx.fillText(e.prismPhase==='recover'?'빈틈!':e.prismAttack==='laser'?'삼중 광선':'반사 결정탄',e.x,e.y-55);ctx.restore();
}
