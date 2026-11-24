// Presentation only: deterministic room details, no gameplay RNG or saved state.
import {drawReferenceMordoSlash} from './reference-frame-art.js';
export const MORDO_COLLAPSE_SECONDS=2.4;
export function collapseShake(token,reduced=false){
 if(reduced||token?.kind!=='return'||(!token.fresh||!token.mordo))return {x:0,y:0};
 const t=token.elapsed,q=Math.max(0,1-t/MORDO_COLLAPSE_SECONDS),strength=9*q*q;
 return {x:Math.sin(t*83)*strength,y:Math.sin(t*109+1)*strength*.7};
}
export function drawMordoCollapse(c,token,reduced=false){
 if(token?.kind!=='return'||(!token.fresh||!token.mordo)||token.elapsed>=MORDO_COLLAPSE_SECONDS)return;
 const t=token.elapsed,fade=Math.min(1,t/.2,(MORDO_COLLAPSE_SECONDS-t)/.35);
 c.save();c.beginPath();c.rect(0,0,960,540);c.clip();c.globalAlpha*=Math.max(0,fade);
 c.fillStyle='#110d1a';c.fillRect(0,0,960,25);c.fillRect(0,487,960,53);
 if(!reduced){for(let i=0;i<18;i++){const x=35+(i*137)%890,phase=(t*.7+i*.117)%1,y=-30+phase*530;c.fillStyle='#15121f88';c.fillRect(x+12,490,12,4);c.fillStyle=i%2?'#625866':'#93827d';c.fillRect(x,y,5+i%5,8+i%7);}}
 c.textAlign='center';c.font='bold 18px Galmuri, monospace';c.fillStyle='#ecd3ae';c.fillText('문을 봉해라… 누구도 나가지 못하게…',480,516);
 c.restore();
}
export function drawCollapseEnvironment(c,s,r,reduced=false){
 if(!s?.key||s.practice||s.bossLayoutVersion===1&&s.campaign!=='expanded')return;
 const seed=(s.floor+1)*71+(r.x||0)*37+(r.y||0)*101,t=s.elapsed||0;
 c.save();c.beginPath();c.rect(25,45,910,455);c.clip();c.setLineDash([]);
 // Sparse floor fissures stay away from the central path and door centres.
 for(let i=0;i<14;i++){
  const x=65+(seed+i*149)%825,y=85+(seed*3+i*89)%370;
  if(Math.abs(x-480)<90||Math.abs(y-270)<45)continue;
  c.strokeStyle='#120f16';c.lineWidth=3;c.beginPath();c.moveTo(x,y);c.lineTo(x+12,y+8);c.lineTo(x+7,y+20);c.lineTo(x+22,y+30);c.stroke();
  c.strokeStyle='#b95b3e88';c.lineWidth=1;c.stroke();
 }
 for(let i=0;i<12;i++){
  const side=i%4,u=80+(seed+i*113)%(side<2?350:780),x=side===0?36:side===1?916:u,y=side<2?u:side===2?54:481;
  if(Math.abs(x-480)<65||Math.abs(y-270)<60)continue;
  c.strokeStyle='#b75d4380';c.lineWidth=2;c.beginPath();c.moveTo(x-6,y-10);c.lineTo(x+3,y);c.lineTo(x-4,y+12);c.stroke();
  const flicker=reduced?0:Math.sin(t*5+i)*2;c.fillStyle='#ce692e99';c.fillRect(x,y-7-flicker,4,10+flicker);c.fillStyle='#efbd6388';c.fillRect(x+1,y-3,2,5);
 }
 if(!reduced){const phase=(t*.22+seed*.01)%1;if(phase<.3){const x=90+(seed*19)%780,y=60+phase*1400;c.fillStyle='#8b7c79';c.fillRect(x,y,4,7);}}
 c.restore();
}

export function drawMordoAttackOrnaments(c,e,a,{flash=false,reduced=false}={}){
 if(e.variant!=='king'||e.hp<=0||!a)return;
 c.save();c.setLineDash([]);c.globalAlpha*=reduced?.35:flash?.75:.4;c.strokeStyle=flash?'#f4d79b':'#b779e8';c.lineWidth=flash?3:1;
 const mark=a.kind==='mark'||a.kind==='blink',x=mark?a.tx:a.x,y=mark?a.ty:a.y;
 if(mark){const radius=a.kind==='blink'?35:65;c.beginPath();c.arc(x,y,radius,0,Math.PI*2);c.stroke();for(let i=0;i<6;i++){const angle=i*Math.PI/3;c.beginPath();c.moveTo(x+Math.cos(angle)*(radius-8),y+Math.sin(angle)*(radius-8));c.lineTo(x+Math.cos(angle)*radius,y+Math.sin(angle)*radius);c.stroke();}}
 const slashArt=flash&&drawReferenceMordoSlash(c,e,a,{reduced});
 if(!reduced&&flash&&!slashArt){for(let i=0;i<12;i++){const angle=(a.aim||0)+i*Math.PI/6,reach=20+(1-a.time/.18)*50;c.fillStyle=i%3?'#b880e2':'#f4d79b';c.fillRect(x+Math.cos(angle)*reach,y+Math.sin(angle)*reach,2,4);}}
 if(a.kind==='slash'&&flash){c.beginPath();c.arc(x,y,Math.min(150,e.hp/e.max<=.65?165:145),a.aim-1.15,a.aim+1.15);c.stroke();}
 c.restore();
}
