// Existing melee actor variant: detached insignia, not a new monster sprite.
export function drawRoamingEliteBadge(c,e,time,reduced=false){
 if(!e.roamingElite||e.hp<=0)return;
 const x=Math.round(e.x),y=Math.max(62,Math.round(e.y-68));
 c.save();c.beginPath();c.rect(25,45,910,455);c.clip();c.globalAlpha=reduced?1:.9+Math.sin(time*3)*.1;
 c.fillStyle='#ead9a9';c.strokeStyle='#17232a';c.lineWidth=3;c.font='bold 11px Galmuri, monospace';c.textAlign='center';
 c.strokeText('유랑 정예',x,y);c.fillText('유랑 정예',x,y);
 c.beginPath();c.moveTo(x-5,y+5);c.lineTo(x,y+2);c.lineTo(x+5,y+5);c.lineTo(x+4,y+10);c.lineTo(x,y+13);c.lineTo(x-4,y+10);c.closePath();c.fill();
 c.strokeStyle='#7b6948';c.lineWidth=1;c.stroke();c.restore();
}
