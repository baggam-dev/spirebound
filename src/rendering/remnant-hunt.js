import {remnantFragments,REMNANT_NAMES} from '../world/remnant-hunt.js';
import {drawEnemySector} from './enemy-attack-vfx.js';
import {drawSoftField} from './ground-visuals.js';
export function remnantBattleTitle(r){return r.remnantBattle?.stage==='whole'?'봉인의 잔해 · 1/2 완전체':r.remnantBattle?.stage==='split'?'봉인의 잔해 · 2/2 분리된 다섯 부위':'봉인조각 수호체 · '+(REMNANT_NAMES[r.remnantPart]||'');}
export function drawRemnantHuntGround(c,s,r,reduced=false){
 const d=r.remnantBattle;if(!d)return;
 c.save();c.beginPath();c.rect(25,45,910,455);c.clip();c.setLineDash([]);
 for(const a of [...d.flashes,...d.attacks]){
  const flash=d.flashes.includes(a);c.globalAlpha=flash?.7:.75;c.strokeStyle=flash?'#f3d391':'#dbafe8';c.lineWidth=flash?3:1;
  if(a.kind==='cleave')drawEnemySector(c,a.x,a.y,160,a.aim,1.05,{warning:!flash,reduced,accent:'#dab0e7'});
  if(a.kind==='stomp'){drawSoftField(c,a.tx,a.ty,90,'#d9a4cd',flash?.7:.3);c.beginPath();c.arc(a.tx,a.ty,90,0,Math.PI*2);c.stroke();}
  if(a.kind==='rush'){const dx=a.tx-a.x,dy=a.ty-a.y,len=Math.hypot(dx,dy),angle=Math.atan2(dy,dx);c.save();c.translate(a.x,a.y);c.rotate(angle);c.strokeRect(0,-44,len,88);c.restore();}
  if(a.kind==='ray'){c.save();c.translate(a.x,a.y);c.rotate(a.aim);c.strokeRect(0,-22,1100,44);c.restore();}
  if(a.kind==='fan'){for(const offset of a.owner==='mouth'?[-.48,-.24,0,.24,.48]:[-.36,-.18,0,.18,.36]){c.beginPath();c.moveTo(a.x,a.y);c.lineTo(a.x+Math.cos(a.aim+offset)*130,a.y+Math.sin(a.aim+offset)*130);c.stroke();}}
  if(a.kind==='nova'){c.beginPath();c.arc(a.x,a.y,85,a.aim+Math.PI/8,a.aim+Math.PI*2-Math.PI/8);c.stroke();}
  c.fillStyle='#f1d9e6';c.font='11px Galmuri, monospace';c.textAlign='center';c.fillText(({cleave:'완전체 휘두르기',stomp:'내려찍기 · 원 밖으로',rush:'직선 돌진 · 옆으로',ray:'눈 광선',fan:'부위 탄막',nova:'방사 탄막 · 틈으로'})[a.kind],a.x,a.y-65);
 }
 c.restore();
}
export function drawRemnantSealDoor(c,s,target,x,y,vertical){
 if(!target?.remnantSeal||target.used||s.key)return;
 const count=remnantFragments(s),w=vertical?29:80,h=vertical?70:35;
 c.save();c.setLineDash([]);c.fillStyle=count===5?'#443b30':'#271e32';c.fillRect(x-5,y-5,w+10,h+10);c.strokeStyle=count===5?'#f1d391':'#b48bc8';c.lineWidth=3;c.strokeRect(x-5,y-5,w+10,h+10);
 if(count<5){c.lineWidth=2;for(const sign of [-1,1]){c.beginPath();c.moveTo(x,y+(sign>0?0:h));c.lineTo(x+w,y+(sign>0?h:0));c.stroke();}}
 c.fillStyle='#f3d8a3';c.font='bold 12px Galmuri, monospace';c.textAlign='center';c.fillText(count+'/5',x+w/2,y+h/2+4);c.restore();
}
