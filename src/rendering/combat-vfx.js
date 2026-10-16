// Deterministic presentation only: no combat RNG, actor mutations or hitboxes.
const box=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
function line(c,points,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(Math.round(x),Math.round(y)):c.moveTo(Math.round(x),Math.round(y)));c.stroke();}
export function drawSynergyTrail(c,element,p,time=0,reduced=false){
 if(reduced)return;c.save();const shift=Math.floor(time*12)%3;
 if(element==='fire'&&p.blastTip){box(c,-3,-2,2,4,'#fff2bc');line(c,[[-21,-4],[-15,0],[-21,4]],'#dd9b64',1);}
 if(element==='fire'&&p.emberMark)for(const side of [-1,1])box(c,-24-shift,side*4,2,2,'#edaa6f');
 if(element==='frost'&&p.frostBond)line(c,[[-20,-3],[-17,0],[-20,3],[-23,0],[-20,-3]],'#c8f5ff',1);
 if(element==='poison'&&p.venomPenetration)for(let i=0;i<2;i++)box(c,-19-i*6,3+i,2,3,'#a6da75');
 if(element==='poison'&&p.plagueSpore)box(c,-27-shift,-4,3,3,'#cfb6dc');
 if(element==='chain'&&p.chargeCell)line(c,[[-22,-3],[-18,0],[-21,1],[-17,4]],'#ffe6ae',1);
 if(element==='chain'&&p.conduction)for(const side of [-1,1])line(c,[[-26,side*4],[-23,side*2],[-20,side*5]],'#c7bbf4',1);
 c.restore();
}
export function drawPlayerSkillStates(c,s,reduced=false){
 const p=s.player;if(!p.chargeCell||!(p.chargeHits||p.chargeReady))return;
 c.save();c.translate(Math.round(p.x),Math.round(p.y-38));
 const count=p.chargeReady?(p.chargeCell>=3?3:4):p.chargeHits;
 for(let i=0;i<count;i++)box(c,-9+i*5,-2,3,3,p.chargeReady?'#fff0b9':'#b0a0d8');
 if(p.chargeReady){const offset=reduced?0:Math.round(Math.sin(s.elapsed*5));line(c,[[-14,-5-offset],[-17,0],[-14,4+offset]],'#d7c3ef',1);line(c,[[13,-5-offset],[16,0],[13,4+offset]],'#d7c3ef',1);}
 c.restore();
}
export function limitSynergyEffects(effects,max=32){let skip=Math.max(0,effects.filter(f=>f.synergyEffect).length-max);return effects.filter(f=>!f.synergyEffect||skip--<=0);}
export function drawSynergyEffect(c,f,reduced=false){
 if(!f.synergyEffect)return false;if(reduced||!(f.t>0))return true;
 const age=1-Math.min(1,f.t/(f.duration||.3));c.save();c.beginPath();c.rect(25,45,910,455);c.clip();c.translate(Math.round(f.x),Math.round(f.y));c.globalAlpha*=Math.min(1,(1-age)*2);
 if(f.synergyEffect==='spore'){
  const dx=f.toX-f.x,dy=f.toY-f.y;for(let i=0;i<4;i++){const t=Math.min(1,age+i*.09);box(c,dx*t,dy*t-Math.sin(t*Math.PI)*8,3,3,i%2?'#c9b1d9':'#a9d18a');}
 }else if(f.synergyEffect==='ember'){
  for(let i=0;i<6;i++){const a=i*Math.PI/3,r=4+age*17;box(c,Math.cos(a)*r,Math.sin(a)*r-age*8,3,4,'#ef9e61');}
  line(c,[[-7,0],[0,-8],[7,0],[0,8],[-7,0]],'#ffe0a6',2);
 }else{
  for(const side of [-1,1])line(c,[[side*4,-18],[side*11,-8],[side*5,-2],[side*12,9]],'#ddc7ff',2);
  box(c,-2,-3,4,6,'#fff4c8');
 }
 c.restore();return true;
}
// Called in projectile-local coordinates with the real travel direction.
export function drawHostileProjectile(c,b,time=0,reduced=false){
 if(!b.enemy)return false;const ice=b.demonIce||b.frostArrow,orb=b.poisonShot==='orb',venom=!!b.poisonShot,dark=b.dark||b.demonShot;
 const color=ice?'#91daef':venom?'#c29bd4':b.ricochet?'#8ed5ca':dark?'#cb9bdc':'#ed9988',light=ice?'#f0fcff':venom?'#f1d0f6':'#fff0d4';
 c.save();
 if(!reduced){for(let i=0;i<3;i++)box(c,-8-i*4,(i%2?1:-1)*(1+(Math.floor(time*15)+i)%2),3,2,color+(i?'55':'99'));}
 if(orb){box(c,-5,-5,10,10,'#30223c');box(c,-4,-4,8,8,color);box(c,-2,-3,3,3,light);if(!reduced){box(c,-7,0,2,2,color);box(c,4,4,2,2,color);}}
 else if(ice){line(c,[[-6,0],[0,-4],[6,0],[0,4],[-6,0]],'#1e3346',3);line(c,[[-5,0],[5,0]],light,2);line(c,[[0,-3],[4,0],[0,3]],color,2);}
 else if(b.ricochet){line(c,[[-5,-3],[4,-3],[6,0],[4,3],[-5,3],[-5,-3]],'#1b3436',3);box(c,-3,-2,7,4,color);box(c,2,-1,3,2,light);}
 else{line(c,[[-5,-3],[5,0],[-5,3]],'#30252e',3);line(c,[[-4,-2],[4,0],[-4,2]],color,2);box(c,1,-1,3,2,light);}
 c.restore();return true;
}
