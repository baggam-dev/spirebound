// A short, directional afterimage. It never changes movement or draws a hit area.
export function drawBlinkTrail(c,f){
 if(!f.blinkTrail)return false;
 const life=Math.max(0,Math.min(1,f.t/f.duration));
 const dx=f.x-f.fromX,dy=f.y-f.fromY,length=Math.hypot(dx,dy);
 if(length<1)return true;
 const nx=-dy/length,ny=dx/length;
 c.save();c.beginPath();c.rect(25,45,910,455);c.clip();
 c.globalAlpha*=life*.7;
 for(let i=0;i<6;i++){
  const along=(i+.5)/7,offset=(i%2?1:-1)*3;
  const x=Math.round(f.fromX+dx*along+nx*offset),y=Math.round(f.fromY+dy*along+ny*offset);
  c.fillStyle=i%2?'#a9d2cb':'#d8ebe1';c.fillRect(x-2,y-1,4,2);
 }
 c.globalAlpha*=.8;c.strokeStyle='#98c9c3';c.lineWidth=2;
 c.beginPath();c.moveTo(f.fromX+dx*.13+nx*5,f.fromY+dy*.13+ny*5);c.lineTo(f.fromX+dx*.72+nx*5,f.fromY+dy*.72+ny*5);c.stroke();
 c.beginPath();c.moveTo(f.fromX+dx*.28-nx*5,f.fromY+dy*.28-ny*5);c.lineTo(f.fromX+dx*.87-nx*5,f.fromY+dy*.87-ny*5);c.stroke();
 c.fillStyle='#e7f3df';c.fillRect(Math.round(f.fromX)-3,Math.round(f.fromY)-3,6,6);
 c.fillRect(Math.round(f.x)-2,Math.round(f.y)-4,4,8);
 c.restore();return true;
}
