import {drawShadowAura} from './shadow-aura.js';
const TAU=Math.PI*2;
const styles={elite:{rank:1,color:'#dba85b'},guardian:{rank:2,color:'#a3d4e6'},trial:{rank:3,color:'#bf8ee8'},key:{rank:4,color:'#ead293'}};
export function monsterStatus(e,room){
 if(room.returnSeal==='guardian'&&!room.returnSealReleased&&room.returnGuardianId===e.id)return 'key';
 if(e.trialChampion)return 'trial';
 if(e.gateTitle||e.elite==='guardian')return 'guardian';
 return e.elite?'elite':null;
}
function body(e){const h=e.type==='brute'?67:e.type==='demonCaptain'?66:e.gateTitle?58:e.type==='boss'?82:52;return {h,feet:e.type==='brute'?24:21,r:e.type==='boss'?34:e.type==='brute'?28:24};}
function ring(c,x,y,r,color,dashed=false){c.strokeStyle=color;c.setLineDash(dashed?[5,4]:[]);c.beginPath();c.ellipse(x,y,r,r*.43,0,0,TAU);c.stroke();c.setLineDash([]);}
function rune(c,x,y,size){c.beginPath();c.moveTo(x,y-size);c.lineTo(x+size*.55,y);c.lineTo(x,y+size);c.lineTo(x-size*.55,y);c.closePath();c.stroke();}
// Render-only layers: never write actors, saves, timers, combat RNG or drop state.
export function drawMonsterStatusEffects(c,run,room,{reduced=false}={}){
 const living=room.enemies.filter(e=>e.hp>0&&e.type!=='minislime'),time=reduced?0:run.elapsed;
 const actors=living.filter(e=>monsterStatus(e,room)||run.key||e.escapeDepth).sort((a,b)=>(styles[monsterStatus(b,room)]?.rank||0)-(styles[monsterStatus(a,room)]?.rank||0)||Math.hypot(a.x-run.player.x,a.y-run.player.y)-Math.hypot(b.x-run.player.x,b.y-run.player.y));
 c.save();c.beginPath();c.rect(25,45,910,455);c.clip();c.lineWidth=1.2;
 for(const [index,e] of actors.entries()){
  const type=monsterStatus(e,room),s=styles[type],b=body(e),t=reduced||e.frozen>0?0:time+(e.id||0)*.31,full=index<(reduced?5:10),foot=e.y+b.feet-2;
  if(run.key||e.escapeDepth){
   if(full&&!reduced)drawShadowAura(c,e,t,{color:'#a44365',width:b.r*2.3,height:b.h+18,opacity:type?.16:.22,speed:1.5,reduced});
   c.save();c.strokeStyle='#c36b88';c.globalAlpha=full?.45:.26;
   for(const side of [-1,1]){const x=e.x+side*(b.r*.65),lift=full&&!reduced?Math.sin(t*5+side)*2:0;c.beginPath();c.moveTo(x,foot-3);c.lineTo(x+side*3,foot-13);c.lineTo(x-side*2,foot-24+lift);c.stroke();
    if(full&&!reduced)for(let k=0;k<2;k++){const q=(t*.7+k*.47)%1;c.globalAlpha=(1-q)*.5;c.fillStyle='#d98b9a';c.fillRect(Math.round(x+side*q*5),Math.round(foot-16-q*b.h),2,2);}}
   c.restore();
  }
  if(!s)continue;
  c.save();c.globalAlpha=full?.52:.3;ring(c,e.x,foot,b.r,s.color,type==='elite');
  if(full){
   c.strokeStyle=s.color;
   if(type==='trial'||type==='key'||type==='guardian'){
    ring(c,e.x,foot,b.r+4,s.color,true);
    for(let i=0;i<(reduced?3:6);i++){const a=i*TAU/(reduced?3:6)+(reduced?0:t*.18),x=e.x+Math.cos(a)*b.r,y=foot+Math.sin(a)*b.r*.43;rune(c,x,y,2.5);}
   }
   const top=e.y+b.feet-b.h-8;
   if(type==='key'){
    c.globalAlpha=.86;c.beginPath();c.arc(e.x,top-10,4,0,TAU);c.moveTo(e.x,top-6);c.lineTo(e.x,top+5);c.moveTo(e.x,top+2);c.lineTo(e.x+4,top+2);c.moveTo(e.x,top+5);c.lineTo(e.x+4,top+5);c.stroke();
   }else if(type==='guardian'){
    c.globalAlpha=.62;rune(c,e.x,top-2,8);for(const side of [-1,1]){c.beginPath();c.moveTo(e.x+side*5,top-3);c.lineTo(e.x+side*15,top+1);c.lineTo(e.x+side*12,top+7);c.stroke();}
   }
   const count=reduced?0:type==='elite'?4:3;
   for(let k=0;k<count;k++){const q=(t*.55+k/count)%1,side=k%2?-1:1,x=e.x+side*(b.r+Math.sin(t+k)*2),y=foot-q*(b.h+5);c.globalAlpha=(1-q)*.65;c.fillStyle=s.color;
    if(type==='trial'){c.strokeStyle=s.color;rune(c,x,y,3);}else c.fillRect(Math.round(x),Math.round(y),2,k%2?4:2);
   }
  }
  c.restore();
 }
 c.restore();
}
