import {CHASER_SLASH} from '../combat/chaser-slash-area.js';
// Caller is at the actor origin without facing reflection: aim is a world angle.
export function drawChaserSweep(c,e){
 if(!(e.chaserStrike>0||e.chaserWindup>0)||!Number.isFinite(e.chaserAim))return;
 if(e.chaserWindup>0){
  c.save();c.rotate(e.chaserAim);c.strokeStyle='#efa78c';c.lineWidth=1.5;c.beginPath();c.arc(0,0,CHASER_SLASH.radius,-CHASER_SLASH.halfAngle,CHASER_SLASH.halfAngle);c.stroke();c.beginPath();c.moveTo(18,0);c.lineTo(32,0);c.stroke();c.restore();return;
 }
 const {radius:r,halfAngle:a,duration}=CHASER_SLASH,fade=Math.min(1,e.chaserStrike/duration);
 c.save();c.rotate(e.chaserAim);c.globalAlpha*=fade;
 // Faint fill exposes the whole damaging sector; the outer crescent marks its edge.
 c.fillStyle='rgba(242,249,245,.13)';c.beginPath();c.moveTo(0,0);c.arc(0,0,r,-a,a);c.closePath();c.fill();
 c.fillStyle='rgba(249,255,252,.88)';c.beginPath();c.arc(0,0,r,-a,a);c.quadraticCurveTo(r*.62,0,r*Math.cos(a),-r*Math.sin(a));c.closePath();c.fill();
 c.strokeStyle='rgba(255,255,255,.96)';c.lineWidth=1.2;c.beginPath();c.arc(0,0,r,-a,a);c.stroke();c.restore();
}
