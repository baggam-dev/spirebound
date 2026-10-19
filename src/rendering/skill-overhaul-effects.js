import {segmentBlocked} from '../world/terrain.js';
export function drawOverhaulEffects(c,s,reduced=false){const r=s.floors[s.floor][s.room],p=s.player,t=s.elapsed;c.save();
 if(s.roll?.kind==='slash'){
  const q=s.roll,progress=Math.min(1,q.elapsed/q.duration);c.save();c.translate(p.x,p.y-10);c.rotate(Math.atan2(q.y,q.x));
  if(!reduced){c.fillStyle='#98dfff55';for(let i=1;i<=3;i++)c.fillRect(-i*14,-8+i,16,2);}
  c.strokeStyle='#6caade';c.lineWidth=reduced?3:6;c.beginPath();c.arc(5,0,28+progress*5,-1.2+progress*.2,1.2+progress*.2);c.stroke();c.strokeStyle='#edfbff';c.lineWidth=2;c.stroke();
  c.fillStyle='#edf7ff';c.fillRect(3,-2,33,3);c.fillStyle='#c9b58a';c.fillRect(1,-6,3,11);c.restore();
 }
 for(const m of r.rollMines||[]){c.fillStyle=m.time<.5?'#f6d58a':'#a38ad5';c.fillRect(m.x-4,m.y-3,8,6);c.strokeStyle='#e7deef';c.strokeRect(m.x-6,m.y-5,12,10);}
 if(p.focusTime>0){c.save();c.translate(p.x,p.y);c.strokeStyle='#ce70db';c.lineWidth=2;c.globalAlpha=.7;for(const side of [-1,1]){c.beginPath();c.moveTo(side*10,-42);c.lineTo(side*17,-52);c.lineTo(side*14,-35);c.stroke();}if(!reduced)for(let i=0;i<5;i++){const a=t*4+i*Math.PI*2/5;c.fillStyle=i%2?'#e7a0e9':'#a677df';c.fillRect(Math.cos(a)*24,-10+Math.sin(a)*12-(t*25+i*8)%35,3,8);}c.restore();}
 if(s.bloodTime>0){c.save();c.translate(p.x,p.y+13);c.scale(1,.42);c.strokeStyle='#da6b9e';c.lineWidth=3;c.beginPath();c.arc(0,0,32,reduced?0:t*1.5,(reduced?0:t*1.5)+Math.PI*1.7);c.stroke();c.restore();}
 if(s.guardianTime>0&&s.guardianCharges>0){c.strokeStyle='#b9e6f3';c.fillStyle='#a8dceb12';c.lineWidth=2;c.beginPath();c.ellipse(p.x,p.y-10,29,40,0,0,Math.PI*2);c.fill();c.stroke();if(!reduced){c.strokeStyle='#f1f8ff';c.beginPath();c.ellipse(p.x-6,p.y-18,16,25,-.3,3.5,5);c.stroke();}}
 if(r.fairyBeam){const b=r.fairyBeam;let length=420;for(let d=6;d<=420;d+=6)if(segmentBlocked(b,{x:b.x+Math.cos(b.aim)*d,y:b.y+Math.sin(b.aim)*d},r.obstacles,1)){length=d-6;break;}c.save();c.translate(b.x,b.y);c.rotate(b.aim);c.globalAlpha=Math.min(1,b.time/.1);c.strokeStyle='#ad8fe6';c.lineWidth=reduced?6:12;c.beginPath();c.moveTo(0,0);c.lineTo(length,0);c.stroke();c.strokeStyle='#f1e9ff';c.lineWidth=3;c.stroke();c.restore();}c.restore();}
