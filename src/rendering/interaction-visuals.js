// Successful interactions only; transient presentation never enters saved state.
import {doorCenter} from '../world/doors.js';
const effects=new WeakMap();
export function emitInteraction(s,kind,room,detail={}){
 const list=(effects.get(s)||[]).filter(e=>e.room===room&&s.elapsed-e.start<.9&&(kind!=='level'||e.kind!=='level'));
 list.push({kind,room,start:s.elapsed,...detail});effects.set(s,list.slice(-4));
}
export function interactionAge(s,r,kind){const e=effects.get(s)?.findLast(e=>e.room===r&&e.kind===kind);return e?Math.max(0,s.elapsed-e.start):Infinity;}
function chestEffect(c,x,y,p,trap,reduced){
 const color=trap?'#e59698':'#e6c785',core=trap?'#ffd0c4':'#fff0c5';
 if(p<.35){c.fillStyle=trap?'#c66f7438':'#f2ce8430';c.fillRect(x-15,y-12,30,6);}
 const n=reduced?3:8;
 for(let i=0;i<n;i++){
  const t=Math.max(0,Math.min(1,p*1.5-i*.04)),side=i/(n-1)*2-1;
  const px=Math.round(x+side*(5+t*15)),py=Math.round(y-10-t*(16+(i%3)*4));
  c.fillStyle=i%3?color:core;c.fillRect(px,py,2,2);
  if(!reduced&&p<.6&&i%3===0){c.fillRect(px-1,py+1,4,1);c.fillRect(px+1,py-1,1,4);}
 }
 // Traps retain an angular red warning, rather than a successful gold reward cue.
 if(trap&&p<.65){c.fillStyle='#ffd0c4';c.fillRect(x-1,y-28,2,6);c.fillRect(x-1,y-20,2,2);}
}
function fountainEffect(c,x,y,p,reduced){
 c.save();c.setLineDash([]);c.lineWidth=1;c.strokeStyle='#a4decf';
 for(let i=0;i<(reduced?1:2);i++){const rr=9+p*13+i*7;c.beginPath();c.ellipse(x,y,rr,rr*.35,0,Math.PI*.12,Math.PI*1.88);c.stroke();}
 for(let i=0;i<(reduced?1:3);i++){
  const xx=x+(i-(reduced?0:1))*9,yy=y-7-p*24-i*2;
  c.strokeStyle=i%2?'#85cbb2':'#bee8d8';c.beginPath();c.moveTo(xx,yy+9);c.lineTo(xx-2,yy+5);c.lineTo(xx+2,yy+1);c.lineTo(xx,yy-3);c.stroke();
  c.fillStyle='#d0eee4';c.fillRect(Math.round(xx),Math.round(yy-4),1,2);
 }
 c.restore();
}
function doorRelease(c,room,d,p,reduced){
 c.save();c.translate(d===1?943:d===3?17:doorCenter(room,d),d===0?25:d===2?520:doorCenter(room,d));c.rotate(d*Math.PI/2);
 c.setLineDash([]);c.lineWidth=1;
 const edge=d%2?35:40,spread=edge+2+p*14;
 for(const side of [-1,1]){
  c.save();c.scale(side,1);c.strokeStyle='#b7d8b2';c.beginPath();c.moveTo(spread+3,-8);c.lineTo(spread,-3);c.lineTo(spread+3,1);c.lineTo(spread+1,7);c.stroke();
  c.fillStyle='#d2e4c6';c.fillRect(Math.round(spread+4),Math.round(-5-p*4),2,2);
  if(!reduced){c.fillStyle='#8fbaa3';c.fillRect(Math.round(spread+7),Math.round(4+p*5),2,1);}
  c.restore();
 }
 c.restore();
}
export function drawInteractionEffects(c,s,r,reduced=false){
 c.save();
 for(const e of effects.get(s)||[]){
  const age=s.elapsed-e.start;if(e.room!==r||age<0||age>=.9)continue;
  const p=age/.9,x=e.x??480,y=e.y??112;c.globalAlpha=(1-p)*.8;
  const color=e.kind==='fountain'?'#a9e9d4':e.kind==='stairs'?'#c9d4e3':e.trap?'#dc8e8e':'#eed08a';c.fillStyle=color;
  if(e.kind==='essence'){
   // The reward is already applied; only a few pixels travel to the player.
   c.fillStyle=e.color||'#d4a1ff';const target=s.player;
   for(let i=0;i<5;i++){const q=Math.max(0,Math.min(1,p*2-i*.09)),bend=Math.sin(q*Math.PI)*12;
    const xx=Math.round(x+(target.x-x)*q),yy=Math.round(y+(target.y-12-y)*q-bend);
    c.fillRect(xx-2,yy-2,4,4);
   }
  }else if(e.kind==='level'){
   const px=Math.round(s.player.x),py=Math.round(s.player.y);
   c.fillStyle='#eed891';
   for(const side of [-1,1])for(let i=0;i<4;i++){const yy=Math.round(py+10-i*10-p*20);c.fillRect(px+side*(22+i%2*4),yy,3,6);}
   c.textAlign='center';c.font='11px Galmuri, monospace';c.fillText('성장 완료 · LV '+e.level,px,py-47-Math.round(p*10));
  }else if(e.kind==='roomClear'){
   c.fillStyle='#b7d8ba';c.textAlign='center';c.font='12px Galmuri, monospace';
   c.fillText(e.unlocked?'전투 종료 · 출구 개방':'전투 종료',480,165-Math.round(p*8));
   c.fillRect(406,170-Math.round(p*8),148,1);
   if(e.unlocked)for(let d=0;d<4;d++){
    if(!e.doors?.[d])continue;
    // All pieces stay outside the open 80/70px passage, including the first frame.
    doorRelease(c,e.room,d,p,reduced);
   }
  }else if(e.kind==='stairs'){
   // Small travelling chevrons around the arrival point; no screen-covering fade.
   for(const dx of [-25,25])for(let i=0;i<3;i++){const yy=Math.round(y+18-i*11-p*18*(e.direction||1));c.fillRect(x+dx-4,yy,3,3);c.fillRect(x+dx-1,yy-3*(e.direction||1),3,3);c.fillRect(x+dx+2,yy,3,3);}
  }else if(e.kind==='chest'){
   chestEffect(c,x,y,p,!!e.trap,reduced);
  }else if(e.kind==='fountain'){
   fountainEffect(c,x,y,p,reduced);
  }else{
   for(let i=0;i<8;i++){const a=i*Math.PI/4,spread=8+p*29;const xx=Math.round(x+Math.cos(a)*spread),yy=Math.round(y-8+Math.sin(a)*spread*.45-p*22);c.fillRect(xx,yy,3,3);}
  }
 }
 c.restore();
}
