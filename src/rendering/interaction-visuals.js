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
function fleck(c,x,y,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),2,2);}
function shrineEffect(c,x,y,p,good,reduced){
 c.save();c.setLineDash([]);c.lineWidth=1;
 const yy=y+12-p*5;
 c.strokeStyle=good?'#e4c88f':'#ac7ca8';
 for(const side of [-1,1]){
  c.beginPath();
  if(good){c.moveTo(x+side*6,yy+2);c.lineTo(x+side*16,yy-2);c.lineTo(x+side*20,yy-7);}
  else{c.moveTo(x+side*(20-p*7),yy-9);c.lineTo(x+side*13,yy-4);c.lineTo(x+side*18,yy);c.lineTo(x+side*8,yy+4);}
  c.stroke();
 }
 for(let i=0;i<(reduced?1:3);i++){
  const dx=reduced?0:(i-1)*10;
  fleck(c,x+dx*(1-p*.4),yy-5-p*8-(i%2)*3,good?'#f1dfb4':'#c28fac');
 }
 c.restore();
}
function pactEffect(c,x,y,p,choice,reduced){
 if(!['blood','supply','trial'].includes(choice))return;
 c.save();c.setLineDash([]);c.lineWidth=1;
 if(choice==='trial'){
  // A short angular challenge mark, never an attack area or an awarded item.
  c.strokeStyle='#ae8ac4';const yy=y-8-p*10;
  c.beginPath();c.moveTo(x-13,yy+7);c.lineTo(x-6,yy-5);c.lineTo(x,yy);c.lineTo(x+6,yy-5);c.lineTo(x+13,yy+7);c.stroke();
  if(!reduced)for(const side of [-1,1])fleck(c,x+side*(17+p*6),yy+3,'#b79ac9');
 }else{
  const n=reduced?2:4;
  for(let i=0;i<n;i++){
   const q=Math.max(0,Math.min(1,p*1.4-i*.07)),yy=y-8+(i-n/2)*4;
   fleck(c,x-10-q*14,yy+q*9,choice==='blood'?'#cf8995':'#b9aa8d');
   fleck(c,x+24-q*16,yy-Math.sin(q*Math.PI)*6,choice==='blood'?'#ead2a1':'#c9c3a0');
  }
  // Exchange uses opposed notches; only blood uses the red falling cost.
  if(choice==='supply'){c.strokeStyle='#d1c7a4';c.beginPath();c.moveTo(x-17,y+4);c.lineTo(x-21,y);c.lineTo(x-17,y-4);c.moveTo(x+17,y+4);c.lineTo(x+21,y);c.lineTo(x+17,y-4);c.stroke();}
 }
 c.restore();
}
function essenceEffect(c,s,e,p,reduced){
 const x=e.x??480,y=e.y??112,target=s.player,color=e.color||'#d4a1ff';
 for(let i=0;i<(reduced?2:5);i++){
  const q=Math.max(0,Math.min(1,p*2-i*.09));if(q>=1)continue;
  const bend=Math.sin(q*Math.PI)*12,xx=x+(target.x-x)*q,yy=y+(target.y-12-y)*q-bend;
  fleck(c,xx,yy,color);
  if(!reduced&&q>0){const t=Math.max(0,q-.035);c.fillStyle=color;c.fillRect(Math.round(x+(target.x-x)*t),Math.round(y+(target.y-12-y)*t-Math.sin(t*Math.PI)*12),1,1);}
 }
 if(p>.54&&p<.84){const xx=Math.round(target.x),yy=Math.round(target.y-12);c.fillStyle=color;c.fillRect(xx-2,yy,5,1);if(!reduced)c.fillRect(xx,yy-2,1,5);}
}
function growthEffect(c,s,e,p,reduced){
 const x=Math.round(s.player.x),y=Math.round(s.player.y),rise=p*14;
 c.save();c.setLineDash([]);c.lineWidth=1;c.strokeStyle='#e7ce94';
 for(const side of [-1,1]){const xx=x+side*24;c.beginPath();c.moveTo(xx+side*3,y+5-rise);c.lineTo(xx,y-rise);c.lineTo(xx,y-18-rise);c.lineTo(xx-side*3,y-23-rise);c.stroke();}
 for(let i=0;i<(reduced?1:3);i++){const dx=reduced?0:(i-1)*7;fleck(c,x+dx,y-33-rise-(i%2)*3,'#f3dfb0');}
 c.fillStyle='#eed891';c.textAlign='center';c.font='11px Galmuri, monospace';c.fillText('성장 완료 · LV '+e.level,x,y-54-Math.round(p*8));c.restore();
}
function stairsEffect(c,x,y,p,direction,reduced){
 const up=direction>0,sign=up?-1:1;
 c.save();c.setLineDash([]);c.lineWidth=1;c.strokeStyle=up?'#b0d2e3':'#9eabc9';
 for(const side of [-1,1])for(let i=0;i<(reduced?1:3);i++){
  const xx=x+side*25,yy=y+14-i*10+sign*p*18;
  c.beginPath();c.moveTo(xx-4,yy);c.lineTo(xx,yy+sign*4);c.lineTo(xx+4,yy);c.stroke();
  if(!reduced)fleck(c,xx,yy-sign*8,up?'#b0d2e3':'#9eabc9');
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
   essenceEffect(c,s,e,p,reduced);
  }else if(e.kind==='level'){
   growthEffect(c,s,e,p,reduced);
  }else if(e.kind==='shrine'){
   shrineEffect(c,x,y,p,!!e.good,reduced);
  }else if(e.kind==='pact'){
   pactEffect(c,x,y,p,e.choice,reduced);
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
   stairsEffect(c,x,y,p,e.direction||1,reduced);
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
