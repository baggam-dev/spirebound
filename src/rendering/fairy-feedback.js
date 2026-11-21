const colors=['#efb46c','#ade1ee','#c6b1ea','#e8d4ff'];
const clamp=n=>Math.max(0,Math.min(1,n));
export function fairyReleaseState(s,index,r){
 if(index===3){const b=r.fairyBeam;return {strength:b?clamp(b.time/.1):0,aim:b?.aim||0};}
 const kind=['sunFairy','snowFairy','stormFairy'][index],b=s.projectiles?.findLast(b=>!b.enemy&&b.passive===kind&&b.life>1.86&&b.life<=2);
 return {strength:b?clamp(1-(2-b.life)/.14):0,aim:b?Math.atan2(b.vy,b.vx):0};
}
export function drawFairyFeedback(c,index,x,y,v,reduced=false){
 if(!(v.strength>0))return;c.save();c.translate(Math.round(x),Math.round(y));c.rotate(v.aim);c.globalAlpha*=v.strength*.65;c.strokeStyle=colors[index];c.lineWidth=1;
 c.beginPath();c.moveTo(6,0);c.lineTo(12,0);c.stroke();
 if(!reduced){
  if(index===1){c.beginPath();c.moveTo(10,-4);c.lineTo(13,0);c.lineTo(10,4);c.lineTo(7,0);c.closePath();c.stroke();}
  else if(index===2){c.beginPath();c.moveTo(7,-5);c.lineTo(11,-2);c.lineTo(8,1);c.lineTo(13,5);c.stroke();}
  else for(const side of [-1,1]){c.beginPath();c.moveTo(5,side*4);c.lineTo(8,side*7);c.stroke();}
 }
 c.restore();
}
// Called in the actual projectile's local direction space, never adds a hit event.
export function drawFairyProjectile(c,b,reduced=false){
 const index=['sunFairy','snowFairy','stormFairy'].indexOf(b.passive);if(b.enemy||index<0)return false;
 c.save();c.strokeStyle=colors[index];c.fillStyle=colors[index];c.lineWidth=1.5;
 if(index===0){c.beginPath();c.moveTo(-6,0);c.lineTo(0,-3);c.lineTo(5,0);c.lineTo(0,3);c.closePath();c.fill();}
 else if(index===1){c.beginPath();c.moveTo(5,0);c.lineTo(0,-4);c.lineTo(-4,0);c.lineTo(0,4);c.closePath();c.stroke();}
 else{c.beginPath();c.moveTo(-6,-2);c.lineTo(-1,1);c.lineTo(-3,3);c.lineTo(5,0);c.stroke();}
 c.fillStyle='#f1e8cf';c.fillRect(0,-1,2,2);if(!reduced){c.globalAlpha*=.4;c.strokeStyle=colors[index];c.beginPath();c.moveTo(-12,0);c.lineTo(-7,0);c.stroke();}c.restore();return true;
}
export function drawFairyKingBeam(c,b,length,reduced=false){
 if(!(length>0))return;const opacity=clamp(b.time/.1);c.save();const alpha=c.globalAlpha;c.translate(b.x,b.y);c.rotate(b.aim);c.globalAlpha*=opacity;
 c.strokeStyle='#ad8fe6';c.lineWidth=reduced?5:10;c.globalAlpha*=.5;c.beginPath();c.moveTo(0,0);c.lineTo(length,0);c.stroke();
 c.globalAlpha=alpha*opacity;c.strokeStyle='#eee4ff';c.lineWidth=2;c.beginPath();c.moveTo(0,0);c.lineTo(length,0);c.stroke();
 if(!reduced){c.globalAlpha*=.6;c.strokeStyle='#d8c5ee';c.lineWidth=1;c.beginPath();c.moveTo(4,-5);c.lineTo(10,-9);c.lineTo(14,-5);c.moveTo(4,5);c.lineTo(10,9);c.lineTo(14,5);c.stroke();}
 c.restore();
}
