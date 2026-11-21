import {engineLane,SEAL_ENGINE} from '../world/seal-engines.js';

// The brass/stone body and its moving bow are code-native; ground warnings are separate.
export function drawSealEngine(ctx,r){
 const d=r.sealEngine;if(!d)return;const active=!d.disabled,charging=d.phase==='warning',release=d.phase==='release';
 ctx.save();ctx.translate(d.x,d.y);ctx.scale(d.direction,1);
 ctx.fillStyle='#11161ccc';ctx.fillRect(-22,-34,39,76);
 for(let row=0;row<5;row++){ctx.fillStyle=row%2?'#666773':'#777783';ctx.fillRect(-24,-39+row*15,30,13);ctx.fillStyle='#aaa399';ctx.fillRect(-24,-39+row*15,30,2);ctx.fillStyle='#393c49';ctx.fillRect(-24,-28+row*15,30,2);}
 ctx.fillStyle='#433b39';ctx.fillRect(-15,-26,30,53);ctx.strokeStyle='#b29a60';ctx.lineWidth=3;ctx.strokeRect(-15,-26,30,53);
 ctx.fillStyle='#5d3342';ctx.fillRect(-10,-35,15,18);ctx.fillStyle='#c3a46b';ctx.fillRect(-3,-32,2,11);ctx.fillRect(-7,-27,10,2);
 ctx.save();ctx.translate(release?-4:0,0);ctx.strokeStyle=d.disabled?'#635e56':'#cbb17b';ctx.lineWidth=4;
 ctx.beginPath();ctx.moveTo(25,-23);ctx.lineTo(40,-11);ctx.lineTo(43,0);ctx.lineTo(40,11);ctx.lineTo(25,23);ctx.stroke();
 ctx.lineWidth=1;ctx.strokeStyle='#e3d8b5';ctx.beginPath();ctx.moveTo(25,-23);ctx.lineTo(charging?8:28,0);ctx.lineTo(25,23);ctx.stroke();
 ctx.fillStyle='#6f6250';ctx.fillRect(0,-5,46,10);ctx.fillStyle='#d3bb87';ctx.fillRect(3,-4,43,2);
 if(active){ctx.fillStyle=charging?'#ffe0a0':'#aa9064';ctx.fillRect(charging?8:22,-1,30,2);}ctx.restore();
 ctx.fillStyle=active?(charging?'#f8d994':'#b98950'):'#4e6560';ctx.beginPath();ctx.moveTo(0,-13);ctx.lineTo(10,0);ctx.lineTo(0,13);ctx.lineTo(-10,0);ctx.closePath();ctx.fill();
 ctx.strokeStyle=active?'#ffe1a3':'#8ca196';ctx.lineWidth=1.5;ctx.stroke();
 ctx.fillStyle='#302e32';for(const y of [-22,22])ctx.fillRect(-13,y-2,4,4);ctx.restore();
 ctx.save();ctx.textAlign='center';ctx.font='11px Galmuri, monospace';ctx.fillStyle=active?'#ddcba4':'#a5b8aa';ctx.fillText(active?'봉인핵':'해제됨',d.x+d.direction*15,d.y+51);ctx.restore();
}
export function drawSealEngineWarning(ctx,r,{reduced=false,player=null}={}){
 const d=r.sealEngine;if(!d||d.disabled)return;ctx.save();
 if(d.phase==='warning'){
  const {start,end,length}=engineLane(d,r);if(length){ctx.fillStyle='#e6a45024';ctx.fillRect(Math.min(start.x,end.x),d.y-17,length,34);ctx.strokeStyle='#f3bd70';ctx.lineWidth=2;ctx.setLineDash([7,5]);ctx.strokeRect(Math.min(start.x,end.x),d.y-17,length,34);ctx.setLineDash([]);
   for(let n=36;n<length;n+=reduced?100:64){const x=start.x+d.direction*n;ctx.beginPath();ctx.moveTo(x-d.direction*5,d.y-5);ctx.lineTo(x,d.y);ctx.lineTo(x-d.direction*5,d.y+5);ctx.stroke();}
   ctx.textAlign='center';ctx.font='11px Galmuri, monospace';ctx.fillStyle='#ffe2ab';ctx.fillText('석궁 발사',start.x+d.direction*Math.min(100,length/2),d.y-24);
  }
 }
 if(player&&Math.hypot(player.x-d.x,player.y-d.y)<85){ctx.textAlign='center';ctx.font='11px Galmuri, monospace';ctx.fillStyle='#dce8cf';ctx.fillText('핵 옆에서 정지하여 해제',d.x+d.direction*82,d.y+66);ctx.fillStyle='#20292d';ctx.fillRect(d.x-20,d.y+56,40,4);ctx.fillStyle='#a7d2a8';ctx.fillRect(d.x-20,d.y+56,40*d.disarm/SEAL_ENGINE.disarm,4);}
 ctx.restore();
}
