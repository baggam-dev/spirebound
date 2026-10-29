import {DEMON_SWEEP,demonSweepSector,demonSweepSide} from '../combat/demon-sweep.js';
import {strokeThreat} from './threat-contours.js';
export function drawDemonSweep(c,a,{flash=false,reduced=false,outlineOnly=false}={}){
 const s=demonSweepSector(a),start=s.aim-s.halfAngle,end=s.aim+s.halfAngle;
 const recovering=flash&&a.time<=DEMON_SWEEP.recover;if(recovering&&reduced)return;
 c.save();if(recovering)c.globalAlpha*=.22*Math.max(0,a.time/DEMON_SWEEP.recover);c.translate(s.x,s.y);c.beginPath();c.moveTo(0,0);c.arc(0,0,s.radius,start,end);c.closePath();if(!outlineOnly&&!recovering){c.fillStyle=flash?'#e6badc40':'#be80b815';c.fill();}c.strokeStyle=recovering?'#9b929f':flash?'#fff0e5':'#efbddc';c.lineWidth=flash&&!recovering?2:1.5;c.setLineDash(recovering?[2,8]:flash?[]:[5,4]);strokeThreat(c);
 if(flash&&!reduced&&!outlineOnly&&!recovering){const t=Math.max(0,Math.min(1,(DEMON_SWEEP.strike+DEMON_SWEEP.recover-a.time)/DEMON_SWEEP.strike)),angle=demonSweepSide(a.kind)>0?start+(end-start)*t:end-(end-start)*t;c.strokeStyle='#fff6dd';c.lineWidth=4;c.beginPath();c.arc(0,0,s.radius*.8,angle-.2,angle+.2);c.stroke();}
 c.restore();
}
