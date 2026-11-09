// Event-only, view-only celebration. Never awards XP, replays on load or blocks input.
const states=new WeakMap();
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
export function startBossClear(run,room,origin){
 if(!run||!room||states.get(run)?.room===room)return false;
 states.set(run,{room,age:0,x:clamp(origin?.x??480,25,935),y:clamp(origin?.y??220,45,500)});return true;
}
export const resetBossClear=run=>{if(run)states.delete(run);};
export function advanceBossClear(run,room,dt,active=true){
 const v=run&&states.get(run);if(!v)return;
 if(v.room!==room){states.delete(run);return;}
 if(active&&dt>0)v.age=Math.min(1.5,v.age+Math.min(.1,dt));
}
export const bossClearState=run=>{const v=run&&states.get(run);return v?{age:v.age,x:v.x,y:v.y}:null;};
export function drawBossClear(c,run,room,{reduced=false}={}){
 const v=run&&states.get(run);if(!v||v.room!==room||v.age>=1.5)return false;
 const t=v.age,wave=1-(1-clamp(t/.65))**2,fade=clamp((1.5-t)/.45);
 const radius=Math.max(...[[0,0],[960,0],[0,540],[960,540]].map(([x,y])=>Math.hypot(x-v.x,y-v.y)));
 c.save();c.beginPath();c.rect(0,0,960,540);c.clip();c.setLineDash([]);c.lineCap='butt';const alpha=c.globalAlpha;
 c.globalAlpha=alpha*fade*(reduced?.27:.6);c.strokeStyle='#f1d398';c.lineWidth=reduced?2:4;c.beginPath();c.arc(v.x,v.y,10+wave*radius,0,Math.PI*2);c.stroke();
 if(!reduced){
  for(let i=0;i<32;i++){const a=i*Math.PI/16,reach=25+wave*radius;c.fillStyle=i%3?'#d4ad67':'#fff0c9';c.fillRect(Math.round(v.x+Math.cos(a)*reach),Math.round(v.y+Math.sin(a)*reach),2,4);}
  if(t>.15&&t<1.15){c.globalAlpha=alpha*Math.sin((t-.15)*Math.PI)*.25;c.fillStyle='#e4c888';for(const x of [8,948]){c.fillRect(x,15,4,510);for(let i=0;i<8;i++)c.fillRect(x===8?15+i%3*3:942-i%3*3,45+i*58,2,12);}for(const y of [8,528])c.fillRect(30,y,900,2);}
 }
 c.globalAlpha=alpha*clamp(t/.12)*clamp((1.2-t)/.25);c.textAlign='center';c.font='bold 24px Galmuri, monospace';c.lineWidth=4;c.strokeStyle='#16191f';c.fillStyle='#fff0ce';c.strokeText('보스 격파',480,110);c.fillText('보스 격파',480,110);
 c.restore();return true;
}
