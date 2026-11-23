// Event-only, view-only celebration. Never awards XP, replays on load or blocks input.
const states=new WeakMap();
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const point=(n,fallback,low,high)=>clamp(Number.isFinite(n)?n:fallback,low,high);
export const BOSS_CLEAR_DURATION=1.8;
export function startBossClear(run,room,origin){
 if(!run||!room||states.get(run)?.room===room||origin?.shadowBoss===1||origin?.split)return false;
 const rewardIds=(room.xpDrops||[]).filter(d=>d.burst==='boss'&&d.born>=(run.elapsed??0)-.1).slice(0,16).map(d=>d.id);
 states.set(run,{room,age:0,x:point(origin?.x,480,25,935),y:point(origin?.y,220,45,500),king:!!origin?.king,rewardIds});return true;
}
export const resetBossClear=run=>{if(run)states.delete(run);};
export function advanceBossClear(run,room,dt,active=true){
 const v=run&&states.get(run);if(!v)return;
 if(v.room!==room){states.delete(run);return;}
 if(active&&Number.isFinite(dt)&&dt>0)v.age=Math.min(BOSS_CLEAR_DURATION,v.age+Math.min(.1,dt));
}
export const bossClearState=run=>{const v=run&&states.get(run);return v?{age:v.age,x:v.x,y:v.y}:null;};
export const bossClearPhase=run=>{
 const v=run&&states.get(run);if(!v||v.age>=BOSS_CLEAR_DURATION)return null;
 return v.age<.08?'impact':v.age<.35?'fracture':v.age<.75?'collapse':v.age<1.2?'reward':'settle';
};
export function bossClearShake(run,{reduced=false}={}){
 const v=run&&states.get(run),age=v?.age??Infinity;
 if(reduced||age>=.2)return {x:0,y:0};
 const strength=4*(1-age/.2)**2;
 return {x:Math.round(Math.sin(age*99+1)*strength),y:Math.round(Math.cos(age*79)*strength*.6)};
}
export function drawBossClear(c,run,room,{reduced=false,combatActive=false}={}){
 const v=run&&states.get(run);if(!v||v.room!==room||v.age>=BOSS_CLEAR_DURATION)return false;
 const t=v.age,fade=clamp((BOSS_CLEAR_DURATION-t)/.35),power=reduced?.55:1;
 const bodyY=clamp(v.y-25,65,475),color=v.king?'#d1a1df':'#e5b974',light=v.king?'#f3def6':'#fff0cf';
 c.save();c.beginPath();c.rect(25,45,910,455);c.clip();c.setLineDash([]);c.lineCap='butt';const alpha=c.globalAlpha;
 // Local impact and floor fracture, never a full-screen white flash.
 if(t<.12){c.globalAlpha=alpha*(1-t/.12)*(reduced?.3:.8);c.strokeStyle=light;c.lineWidth=reduced?2:4;c.beginPath();c.moveTo(v.x-20,bodyY+26);c.lineTo(v.x+20,bodyY-26);c.moveTo(v.x-17,bodyY-8);c.lineTo(v.x+16,bodyY+8);c.stroke();}
 if(t<.65){
  const q=1-(1-clamp(t/.65))**3;c.globalAlpha=alpha*(1-t/.65)*.65*power;c.strokeStyle=color;c.lineWidth=2;c.beginPath();
  for(let i=0;i<=32;i++){const a=i*Math.PI/16,x=Math.round(v.x+Math.cos(a)*(12+q*130)),y=Math.round(v.y+Math.sin(a)*(8+q*48));i?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();
 }
 if(t>.08&&t<.9){
  const q=clamp((t-.08)/.82),count=reduced?8:28;c.globalAlpha=alpha*(1-q)*.85;
  for(let i=0;i<count;i++){
   const a=i*2.39996,reach=(18+i%7*9)*(1-(1-q)**3),x=v.x+Math.cos(a)*reach,y=bodyY+Math.sin(a)*reach*.65-28*q+q*q*90;
   c.fillStyle=i%4?color:light;c.fillRect(Math.round(x),Math.round(y),2+i%3,2+i%4);
  }
 }
 // Shafts only mark actual, still-present newly dropped boss XP. Existing XP
 // drawing/attraction handles flight and pickup; no fake items or counters.
 if(t>.55){
  const glow=clamp((t-.55)/.2)*fade*(reduced?.2:.45),ids=reduced?v.rewardIds.slice(0,6):v.rewardIds;
  for(const id of ids){const drop=room.xpDrops?.find(d=>d.id===id);if(!drop||drop.attract)continue;
   c.globalAlpha=alpha*glow*.35;c.fillStyle=color;c.fillRect(Math.round(drop.x)-2,Math.round(drop.y)-34,4,34);
   c.globalAlpha=alpha*glow;c.fillStyle=light;c.fillRect(Math.round(drop.x),Math.round(drop.y)-20,1,20);
  }
 }
 c.restore();
 // Active enemies/projectiles keep their visual space; only a local burst then.
 if(!combatActive&&t>=.55){
  c.save();const a=clamp((t-.55)/.15)*fade;c.globalAlpha*=a;c.textAlign='center';c.font='bold 24px Galmuri, monospace';c.lineWidth=4;c.strokeStyle='#16191f';c.fillStyle=light;
  const title=v.king?'타락한 왕 격파':'보스 격파';c.strokeText(title,480,110);c.fillText(title,480,110);
  c.globalAlpha*=.65;c.fillStyle=color;c.fillRect(405,124,150,2);c.restore();
 }
 return true;
}
