// Separate render-only decoration. Never used as an attack range or a damage field.
export const isVera=e=>e?.type==='astralSniper'&&!!e.gateTitle;
export function drawVeraSigil(c,e,time=0,{reduced=false,staticPose=false}={}){
 if(!isVera(e)||e.hp<=0||staticPose)return false;
 const t=reduced?0:time,active=!!(e.darkAttack||e.eliteWarning>0),r=27;
 c.save();c.translate(e.x,e.y+21);c.scale(1,.43);c.rotate(t*.12);c.globalAlpha*=active?.36:.2;c.strokeStyle='#bda1d8';c.lineWidth=1.2;c.setLineDash([7,5]);c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.stroke();c.setLineDash([]);
 for(let i=0;i<4;i++){const a=i*Math.PI/2,x=Math.cos(a)*r,y=Math.sin(a)*r;c.beginPath();c.moveTo(x-3,y);c.lineTo(x,y-4);c.lineTo(x+3,y);c.lineTo(x,y+4);c.closePath();c.stroke();}
 c.restore();return true;
}
export function drawVeraArrow(c,b,time=0,reduced=false){
 if(!b.enemy||typeof b.source!=='string'||!b.source.includes('베라'))return false;
 c.save();c.fillStyle='#171421';c.fillRect(-9,-2,12,4);c.beginPath();c.moveTo(6,0);c.lineTo(0,-4);c.lineTo(-3,0);c.lineTo(0,4);c.closePath();c.fill();
 c.fillStyle='#caa9f0';c.fillRect(-8,-1,10,2);c.beginPath();c.moveTo(4,0);c.lineTo(0,-2);c.lineTo(-1,0);c.lineTo(0,2);c.closePath();c.fill();c.fillStyle='#fff1fc';c.fillRect(-4,0,7,1);
 if(!reduced){c.globalAlpha*=.38;c.fillStyle='#ba8cdd';c.fillRect(-14,-1,3,2);c.fillRect(-19,Math.sin(time*6)>0?-1:0,2,1);}
 c.restore();return true;
}
