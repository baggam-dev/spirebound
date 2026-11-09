// Layered pixel effects, always local to contact or the real spell area.
const box=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
function polygon(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(Math.round(x),Math.round(y)):c.moveTo(Math.round(x),Math.round(y)));c.closePath();c.fill();}
export function drawElementCrown(c,kind,age,level=1){
 c.save();c.globalAlpha*=Math.max(0,1-age)*.75;const r=5+Math.sin(age*Math.PI)*12;
 if(kind==='fire'){
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;c.save();c.rotate(a);polygon(c,[[2,-3],[r+8,-5],[r+3,0],[r+6,3],[2,3]],'#9b4134');polygon(c,[[2,-2],[r+5,-3],[r,1],[2,2]],'#f7a45c');box(c,r-1,-2,3,2,'#ffe3a4');c.restore();}
 }else if(kind==='frost'){
  for(let i=0;i<4;i++){c.save();c.rotate(i*Math.PI/2+.35);polygon(c,[[3,0],[r+7,-4],[r+3,5]],'#346c93');polygon(c,[[3,0],[r+7,-4],[r+2,1]],'#b9edfa');box(c,r+3,-3,2,2,'#f3ffff');c.restore();}
 }else if(kind==='poison'){
  for(let i=0;i<5;i++){const a=i*2.4,x=Math.cos(a)*r,y=Math.sin(a)*r*.6-age*8;box(c,x-3,y-2,7,4,'#345946');box(c,x-1,y-4,4,7,'#6eaa61');box(c,x,y-3,2,2,'#d0eb9d');}
 }else{
  for(let i=0;i<Math.min(5,level+2);i++){const a=i*2.4;polygon(c,[[Math.cos(a)*3,Math.sin(a)*3],[Math.cos(a+.15)*(r+6),Math.sin(a+.15)*(r+6)],[Math.cos(a+.35)*7,Math.sin(a+.35)*7]],'#d7c7f4');}
 }
 c.restore();
}
export function drawPlayerBlast(c,f,reduced=false){
 if(f.playerBlast!=='fire')return false;
 const duration=f.duration||.22,age=1-Math.max(0,Math.min(1,f.t/duration)),radius=Math.max(0,f.r||0);
 if(!(f.t>0)||!radius)return true;
 c.save();c.beginPath();c.rect(25,45,910,455);c.clip();c.translate(Math.round(f.x),Math.round(f.y));
 c.beginPath();c.arc(0,0,radius,0,Math.PI*2);c.clip();const alpha=c.globalAlpha;
 if(age*duration<.05){c.globalAlpha=alpha*(1-age*duration/.05)*.85;box(c,-5,-2,10,4,'#fff0b5');box(c,-2,-5,4,10,'#fff0b5');}
 // A short local core followed by separated flame wedges; the center clears fast.
 for(let i=0;i<(reduced?4:8);i++){const a=i*Math.PI*2/(reduced?4:8);c.save();c.rotate(a);const reach=radius*(.16+.7*(1-(1-age)**3)),width=(reduced?3:7)*(1-age)+1,inner=Math.max(5,reach-(reduced?12:24)*(1-age));c.globalAlpha=alpha*(1-age)**1.3*(reduced?.65:.85);polygon(c,[[inner,0],[reach*.8,-width],[reach,0],[reach*.8,width]],'#f8a15b');if(!reduced&&age<.55){c.globalAlpha*=.8;box(c,reach*.8,-1,4,2,'#fff0b5');}c.restore();}
 c.restore();return true;
}
export function limitPlayerBlasts(effects,max=12){let skip=Math.max(0,effects.filter(f=>f.playerBlast).length-max);return effects.filter(f=>!f.playerBlast||skip--<=0);}
