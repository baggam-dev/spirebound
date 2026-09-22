import {objectPoint} from './object-positions.js';
// Decoration only: deterministic room variation, no gameplay state or random draws.
const palettes=[['#52634f','#839078'],['#655e4e','#9b8d68'],['#554d69','#9a87af'],['#455b71','#8cacc0'],['#425b43','#82976a'],['#55593c','#a0a16c'],['#454762','#9990af'],['#603e4b','#ac8d66']];
export function drawRoomBackdrop(c,s,r){
 const floor=Math.max(0,Math.min(7,s.floor|0)),[shade,light]=palettes[floor];
 const seed=Math.abs(((r.x||0)*37+(r.y||0)*71+floor*13)|0);
 const box=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
 c.save();c.beginPath();c.rect(26,45,908,455);c.clip();
 // Inlaid masonry: broad, quiet bands leave hazards and projectiles readable.
 c.globalAlpha=.18;
 for(const y of [113,423]){box(105,y,750,2,light);for(let x=110;x<855;x+=30)box(x,y+4,14,2,shade);}
 for(let i=0;i<18;i++){const x=115+(i*131+seed*17)%720,y=145+(i*73+seed*11)%255;box(x,y,24,2,shade);box(x+24,y,2,9,shade);}
 c.globalAlpha=.65;
 for(const x of [185,695]){
  box(x-7,47,94,54,'#151d24');box(x-3,49,86,3,light);box(x,54,80,42,shade);box(x+3,57,74,36,'#20272b');
  if(floor===0){ // Eroded stone relief and moss.
   for(let i=0;i<4;i++){box(x+12+i*15,63,10,23,shade);box(x+12+i*15,63,10,3,light);}
   for(let i=0;i<6;i++)box(x+5+i*11,88-i%3*3,8,4,'#4d694c');
  }else if(floor===1){
   for(const dx of [21,52]){box(x+dx,61,3,28,light);box(x+dx-7,76,17,3,light);box(x+dx-5,58,13,5,shade);}
  }else if(floor===2){
   for(let i=0;i<9;i++){const h=15+(i+seed)%3*4;box(x+7+i*7,87-h,5,h,[shade,light,'#697a78'][i%3]);box(x+8+i*7,83,3,1,'#c4ad7f');}box(x+4,88,72,3,shade);
  }else if(floor===3){
   for(const dx of [18,40,62]){c.fillStyle=light;c.beginPath();c.moveTo(x+dx,59);c.lineTo(x+dx+8,74);c.lineTo(x+dx,89);c.lineTo(x+dx-8,74);c.closePath();c.fill();box(x+dx,66,2,17,shade);}
  }else if(floor===4){
   for(let i=0;i<5;i++){const xx=x+10+i*14;box(xx,62,2,28,shade);box(xx-5,67+i%2*8,6,4,light);box(xx+2,76-i%2*8,6,4,light);}box(x+4,89,72,3,shade);
  }else if(floor===5){
   for(let i=0;i<8;i++){const xx=x+9+i%4*18,yy=63+Math.floor(i/4)*17;box(xx,yy,12,11,shade);box(xx+2,yy+2,8,6,light);box(xx+4,yy+4,4,5,'#343a2a');}
  }else if(floor===6){
   c.strokeStyle=light;c.lineWidth=1;c.beginPath();c.moveTo(x+10,82);c.lineTo(x+28,63);c.lineTo(x+47,79);c.lineTo(x+68,61);c.stroke();for(const [dx,dy] of [[10,82],[28,63],[47,79],[68,61]])box(x+dx-2,dy-2,4,4,light);
  }else{
   box(x+17,58,46,33,'#623547');box(x+24,67,32,5,light);for(const dx of [24,38,52])box(x+dx,61,4,9,light);box(x+28,75,24,3,light);box(x+19,85,10,7,shade);box(x+51,85,10,7,shade);
  }
 }
 // Side-wall footings stay clear of the central doors and traversal lanes.
 for(const x of [56,888])for(const y of [145,353]){box(x,y,16,45,'#192226');box(x-3,y,22,5,shade);box(x+3,y+7,3,29,light);box(x-4,y+41,24,6,shade);}
 // An inset runner distinguishes peaceful reward rooms without suggesting a hazard.
 if(['treasure','fountain','shrine','event'].includes(r.type)){
  const q=objectPoint(r);c.translate(q.x-480,q.y-115);c.globalAlpha=.22;const color=({treasure:'#b29a62',fountain:'#73aaa0',shrine:'#a58bb8',event:'#977290'})[r.type];
  box(435,85,90,73,color);box(441,91,78,61,'#182329');for(const x of [438,519])for(let y=94;y<155;y+=12)box(x,y,3,5,color);
 }
 c.restore();
}
