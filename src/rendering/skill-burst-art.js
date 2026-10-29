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
export function drawPlayerBlast(c,f){
 if(f.playerBlast!=='fire')return false;
 const age=1-Math.max(0,Math.min(1,f.t/(f.duration||.22))),radius=Math.max(0,f.r||0);
 c.save();c.beginPath();c.rect(25,45,910,455);c.clip();c.translate(Math.round(f.x),Math.round(f.y));
 // Open flame petals expose the floor between lobes, rather than an opaque disk.
 for(let i=0;i<8;i++){const a=i*Math.PI/4;c.save();c.rotate(a);const reach=radius*(.2+.68*Math.sin(age*Math.PI*.85));c.globalAlpha=(1-age)*.26;polygon(c,[[2,-3],[reach*.65,-6],[reach,0],[reach*.55,5],[2,3]],'#b44b37');c.globalAlpha=(1-age)*.42;polygon(c,[[3,-2],[reach*.65,-3],[reach*.86,0],[reach*.55,2]],'#f8a15b');box(c,reach*.78,0,3,2,'#fbe0a0');c.restore();}
 drawElementCrown(c,'fire',age,3);c.restore();return true;
}
export function limitPlayerBlasts(effects,max=12){let skip=Math.max(0,effects.filter(f=>f.playerBlast).length-max);return effects.filter(f=>!f.playerBlast||skip--<=0);}
