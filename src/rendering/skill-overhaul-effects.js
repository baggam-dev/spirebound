import {drawFairyKingBeam} from './fairy-feedback.js';
import {segmentBlocked} from '../world/terrain.js';
import {drawSlashRibbon} from './arrow-impact-visuals.js';
export function drawOverhaulEffects(c,s,reduced=false){const r=s.floors[s.floor][s.room],p=s.player;c.save();
 if(s.roll?.kind==='slash'){
  const q=s.roll,progress=Math.min(1,q.elapsed/q.duration);c.save();c.translate(p.x,p.y-10);c.rotate(Math.atan2(q.y,q.x));
  c.save();c.translate(5,0);drawSlashRibbon(c,28+progress*5,progress,{start:-1.2+progress*.2,end:1.2+progress*.2,reduced,heavy:true});c.restore();
  c.fillStyle='#edf7ff';c.fillRect(3,-2,33,3);c.fillStyle='#c9b58a';c.fillRect(1,-6,3,11);c.restore();
 }
 for(const m of r.rollMines||[]){c.fillStyle=m.time<.5?'#f6d58a':'#a38ad5';c.fillRect(m.x-4,m.y-3,8,6);c.strokeStyle='#e7deef';c.strokeRect(m.x-6,m.y-5,12,10);}
 if(r.fairyBeam){const b=r.fairyBeam;let length=420;for(let d=6;d<=420;d+=6)if(segmentBlocked(b,{x:b.x+Math.cos(b.aim)*d,y:b.y+Math.sin(b.aim)*d},r.obstacles,1)){length=d-6;break;}drawFairyKingBeam(c,b,length,reduced);}c.restore();}
