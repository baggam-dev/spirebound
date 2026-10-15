import {DEMON_SWEEP,demonSweepSector,demonSweepSide} from '../combat/demon-sweep.js';
export function drawDemonSweep(c,a,{flash=false,reduced=false}={}){
 const s=demonSweepSector(a),start=s.aim-s.halfAngle,end=s.aim+s.halfAngle;
 c.save();c.translate(s.x,s.y);c.beginPath();c.moveTo(0,0);c.arc(0,0,s.radius,start,end);c.closePath();c.fillStyle=flash?'#e6badc66':'#be80b83d';c.fill();c.strokeStyle=flash?'#fff0e5':'#efbddc';c.lineWidth=flash?3:1.5;c.stroke();
 if(flash&&!reduced){const t=Math.max(0,Math.min(1,(DEMON_SWEEP.strike+DEMON_SWEEP.recover-a.time)/DEMON_SWEEP.strike)),angle=demonSweepSide(a.kind)>0?start+(end-start)*t:end-(end-start)*t;c.strokeStyle='#fff6dd';c.lineWidth=4;c.beginPath();c.arc(0,0,s.radius*.8,angle-.2,angle+.2);c.stroke();}
 c.restore();
}
