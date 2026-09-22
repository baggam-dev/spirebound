// Successful interactions only; transient presentation never enters saved state.
const effects=new WeakMap();
export function emitInteraction(s,kind,room,detail={}){
 const list=(effects.get(s)||[]).filter(e=>e.room===room&&s.elapsed-e.start<.9&&(kind!=='level'||e.kind!=='level'));
 list.push({kind,room,start:s.elapsed,...detail});effects.set(s,list.slice(-4));
}
export function interactionAge(s,r,kind){const e=effects.get(s)?.findLast(e=>e.room===r&&e.kind===kind);return e?Math.max(0,s.elapsed-e.start):Infinity;}
export function drawInteractionEffects(c,s,r){
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
    c.save();c.translate(d===1?943:d===3?17:480,d===0?25:d===2?520:270);c.rotate(d*Math.PI/2);
    // A broken seal retreats to the jambs; the opening is immediately traversable.
    const spread=Math.round(12+p*27);c.fillStyle='#c5dec0';
    for(const side of [-1,1]){c.fillRect(side*spread-2,-6,4,12);c.fillRect(side*(spread+6)-1,3+p*6,2,3);}
    c.fillStyle='#8ac8ac';c.fillRect(-26,-9,52,2);c.restore();
   }
  }else if(e.kind==='stairs'){
   // Small travelling chevrons around the arrival point; no screen-covering fade.
   for(const dx of [-25,25])for(let i=0;i<3;i++){const yy=Math.round(y+18-i*11-p*18*(e.direction||1));c.fillRect(x+dx-4,yy,3,3);c.fillRect(x+dx-1,yy-3*(e.direction||1),3,3);c.fillRect(x+dx+2,yy,3,3);}
  }else{
   for(let i=0;i<8;i++){const a=i*Math.PI/4,spread=8+p*29;const xx=Math.round(x+Math.cos(a)*spread),yy=Math.round(y-8+Math.sin(a)*spread*.45-p*22);c.fillRect(xx,yy,3,3);}
   if(e.kind==='fountain'){c.fillRect(x-12,y-10-p*16,24,2);c.fillRect(x-7,y-5-p*10,14,2);}
  }
 }
 c.restore();
}
