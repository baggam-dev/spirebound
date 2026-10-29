// Draw the existing threat path twice, never a second fill/animation or hitbox.
export function strokeThreat(c){
 const color=c.strokeStyle,width=c.lineWidth;c.strokeStyle='#15131c';c.lineWidth=width+2;c.stroke();c.strokeStyle=color;c.lineWidth=width;c.stroke();
}
export function drawThreatCircle(c,x,y,r,{warning=false,progress=0,opacity=1}={}){
 if(!(r>0))return;c.save();c.globalAlpha*=opacity;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.clip();c.strokeStyle=warning?'#e9b278':'#c3a1d4';c.lineWidth=1.6;c.setLineDash(warning?[5,4]:[]);c.beginPath();c.arc(x,y,r-.8,0,Math.PI*2);strokeThreat(c);c.setLineDash([]);
 for(let i=0;i<(warning?8:6);i++){const a=i*Math.PI*2/(warning?8:6),rr=r-3;c.beginPath();c.moveTo(x+Math.cos(a-.045)*(rr-3),y+Math.sin(a-.045)*(rr-3));c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);c.lineTo(x+Math.cos(a+.045)*(rr-3),y+Math.sin(a+.045)*(rr-3));c.stroke();}
 c.restore();
}
export function drawHazardContours(c,room){
 c.save();c.beginPath();c.rect(25,45,910,455);c.clip();
 for(const h of room.hazards||[])if(h.phase==='warning'||h.phase==='active')drawThreatCircle(c,h.x,h.y,h.r,{warning:h.phase==='warning',opacity:.8});
 c.restore();
}
