import {BOSS_APPROACH,pendingBoss} from '../world/boss-approach.js';
import {objectPoint} from '../world/object-positions.js';

let moments=new WeakMap();
export const clearEncounterTransitions=()=>{moments=new WeakMap();};
export function encounterMoment(s,r,kind){
 const data=moments.get(r)||{};data[kind]=s.elapsed;moments.set(r,data);
}
export function drawEncounterGround(c,s,r,reduced=false){
 const data=moments.get(r),age=s.elapsed-(data?.approach??-Infinity),visible=pendingBoss(s,r)?1:Math.max(0,1-age/.2);
 c.save();
 if(visible>0){
  const {x,y,rx,ry}=BOSS_APPROACH;c.save();c.translate(x,y);c.scale(1,ry/rx);c.globalAlpha=visible;
  const g=c.createRadialGradient(0,0,0,0,0,rx);g.addColorStop(0,'#bd835b28');g.addColorStop(.65,'#a7644818');g.addColorStop(1,'#a7644800');
  c.fillStyle=g;c.beginPath();c.arc(0,0,rx,0,Math.PI*2);c.fill();c.strokeStyle='#d6a57588';c.lineWidth=1.2;c.setLineDash([7,6]);c.beginPath();c.arc(0,0,rx,0,Math.PI*2);c.stroke();c.restore();
  if(pendingBoss(s,r)){c.textAlign='center';c.font='13px Galmuri, monospace';c.fillStyle='#d5b08b';c.fillText('다가가면 전투 시작',x,y+26);}
 }
 const defeatAge=s.elapsed-(data?.defeat??-Infinity);
 if(defeatAge<.45){const p=objectPoint(r),q=defeatAge/.45;c.globalAlpha=(1-q)*.6;c.strokeStyle='#e1c48d';c.lineWidth=1.5;c.setLineDash([]);c.beginPath();c.ellipse(p.x,p.y+10,24+q*30,9+q*10,0,0,Math.PI*2);c.stroke();if(!reduced)for(let i=0;i<6;i++){c.fillStyle=i%2?'#e1c48d':'#fff0bd';c.fillRect(Math.round(p.x+Math.cos(i)*q*33),Math.round(p.y-8-q*16+i%2*4),2,2);}}
 c.restore();
}

function key(c,x,y,alpha=1){
 c.save();c.globalAlpha=alpha;c.strokeStyle='#efd28c';c.lineWidth=2;c.setLineDash([]);c.beginPath();c.arc(x,y-9,4,0,Math.PI*2);c.moveTo(x,y-5);c.lineTo(x,y+10);c.moveTo(x,y+6);c.lineTo(x+5,y+6);c.moveTo(x,y+10);c.lineTo(x+4,y+10);c.stroke();c.restore();
}
export function drawReturnKey(c,token,player,reduced=false){
 if(!token?.fresh||token.elapsed>.95)return;
 const q=Math.min(1,token.elapsed/.9),origin=token.origin,target={x:player.x,y:player.y-22};
 c.save();c.setLineDash([]);
 if(reduced){key(c,target.x,target.y,1-q);c.restore();return;}
 const at=t=>({x:origin.x+(target.x-origin.x)*t+Math.sin(t*Math.PI)*30,y:origin.y+(target.y-origin.y)*t-Math.sin(t*Math.PI)*30});
 for(let i=0;i<14;i++){const t=q-i*.018;if(t<0)continue;const p=at(t);c.globalAlpha=Math.max(0,1-i/14)*(1-q*.65);c.fillStyle=i%3?'#e9b85f':'#fff2b9';c.fillRect(Math.round(p.x),Math.round(p.y),2,2);}
 const p=at(q);key(c,p.x,p.y,1-Math.max(0,(q-.8)/.2));c.restore();
}
