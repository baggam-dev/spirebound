// Detached states only: no glow baked into sprites and no hit reactions.
export function drawCriticalSkillStates(c,s,room,reduced=false){
 c.save();c.lineWidth=1.5;c.strokeStyle='#d5bd88';
 for(const e of room.enemies)if(e.hp>0&&e.critMarkTime>0){
  const x=Math.round(e.x),y=Math.round(e.y-18);c.globalAlpha=.8;
  c.beginPath();c.moveTo(x-9,y);c.lineTo(x-3,y-7);c.moveTo(x+3,y+7);c.lineTo(x+9,y);c.moveTo(x-1,y-6);c.lineTo(x+3,y-1);c.lineTo(x-3,y+3);c.lineTo(x+1,y+7);c.stroke();
 }
 const p=s.player;c.globalAlpha=.75;
 if(p.critFocusTime>0){c.beginPath();c.ellipse(p.x,p.y+5,19,6,0,0,reduced?Math.PI:Math.PI*1.6);c.stroke();}
 if(p.royalJudgment&&(s.critical?.royalCharges||0)>=8){
  const x=Math.round(p.x),y=Math.round(p.y-64);c.fillStyle='#e3c98d';c.beginPath();c.moveTo(x-8,y);c.lineTo(x-6,y+7);c.lineTo(x+6,y+7);c.lineTo(x+8,y);c.lineTo(x+3,y+3);c.lineTo(x,y-3);c.lineTo(x-3,y+3);c.closePath();c.fill();
 }
 c.restore();
}
