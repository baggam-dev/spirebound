export function stoneWallEdges(walls){
 const edges=[];
 for(const wall of walls){
  const {x,y,w,h}=wall;
  for(const [side,axis,start,end] of [['top',y,x,x+w],['bottom',y+h,x,x+w],['left',x,y,y+h],['right',x+w,y,y+h]]){
   let spans=[[start,end]];
   for(const other of walls){
    if(other===wall)continue;
    const horizontal=side==='top'||side==='bottom';
    const covered=side==='top'?other.y<axis&&other.y+other.h>=axis:side==='bottom'?other.y<=axis&&other.y+other.h>axis:side==='left'?other.x<axis&&other.x+other.w>=axis:other.x<=axis&&other.x+other.w>axis;
    if(!covered)continue;
    const lo=horizontal?other.x:other.y,hi=lo+(horizontal?other.w:other.h);
    spans=spans.flatMap(([a,b])=>hi<=a||lo>=b?[[a,b]]:[[a,Math.min(b,lo)],[Math.max(a,hi),b]].filter(([c,d])=>d>c));
   }
   edges.push(...spans.map(([start,end])=>({side,axis,start,end})));
  }
 }
 return edges;
}

// Four 960x540 surfaces at most (~8 MiB RGBA); geometry changes invalidate entries.
const surfaces=new Map();
export const outerWalls=[{x:0,y:0,w:960,h:44,type:'wall'},{x:0,y:508,w:960,h:32,type:'wall'},{x:0,y:35,w:25,h:475,type:'wall'},{x:935,y:35,w:25,h:475,type:'wall'}];
function stamp(obstacles){return obstacles.filter(o=>o.type==='wall').map(o=>[o.x,o.y,o.w,o.h].join(',')).join(';');}
function cellHash(x,y){let n=Math.imul(x/48+31,73856093)^Math.imul(y/40+17,19349663);n=Math.imul(n^(n>>>13),1274126177);return (n^(n>>>16))>>>0;}
// Muted stone families follow the floor backdrops; outer and inner walls share one surface.
const stone=[
 ['#3c4742','#11191b'],['#3c4742','#11191b'],
 ['#414650','#171b23'],['#404252','#171823'],
 ['#3a4940','#141e19'],['#3e4038','#1b1b15'],
 ['#3a434e','#151a24'],['#4b3d43','#1d171c'],
 ['#423636','#1a171b'],['#39313d','#14131c']
];
export function paintStoneWalls(ctx,obstacles,floor=0){
 const walls=obstacles.filter(o=>o.type==='wall');if(!walls.length)return;
 const theme=Math.max(0,Math.min(9,floor|0)),basalt=theme>=8,deep=theme>=9;
 const [face,mortar]=stone[theme];
 ctx.save();ctx.beginPath();for(const o of walls)ctx.rect(o.x,o.y,o.w,o.h);ctx.clip();
 ctx.fillStyle=mortar;for(const o of walls)ctx.fillRect(o.x,o.y,o.w,o.h);
 // The same deterministic, world-aligned masonry covers both outer and inner walls.
 const cells=new Set();for(const o of walls)for(let y=Math.floor(o.y/40)*40;y<o.y+o.h;y+=40)for(let x=Math.floor(o.x/48)*48;x<o.x+o.w;x+=48){
  const key=y*960+x;if(cells.has(key))continue;cells.add(key);const h=cellHash(x,y);
  ctx.fillStyle=face;ctx.fillRect(x,y,46,38);
  ctx.fillStyle='#ffffff0b';ctx.fillRect(x+2,y+2,42,2);
  ctx.fillStyle='#101b1a26';ctx.fillRect(x+2,y+34,42,3);
  if(h%5===0){ctx.fillStyle='#202b2938';ctx.fillRect(x+9+(h%25),y+9,2,8);ctx.fillRect(x+11+(h%25),y+17,5,1);}
  if(h%9===0){ctx.fillStyle='#61705b38';ctx.fillRect(x+4+(h%30),y+4,7,2);}
  if(h%7===0){ctx.fillStyle='#b5b8a21c';ctx.fillRect(x+5+(h%31),y+26,4,1);}
  if(theme>=2&&theme<=7&&h%3===0){
   const a=x+6+h%25,b=y+9+(h>>>3)%17;
   if(theme===2){ctx.fillStyle='#b9aa8850';ctx.fillRect(a,b,12,1);ctx.fillRect(a+2,b+2,8,1);}
   if(theme===3){ctx.fillStyle='#9e92b14f';ctx.fillRect(a,b,2,7);ctx.fillRect(a+2,b+6,7,1);}
   if(theme===4){ctx.fillStyle='#6d8e635c';ctx.fillRect(a,b,7,2);ctx.fillRect(a+5,b-3,2,5);}
   if(theme===5){ctx.fillStyle='#ae9d6652';ctx.fillRect(a,b,9,1);ctx.fillRect(a+1,b+3,2,3);ctx.fillRect(a+7,b+3,2,3);}
   if(theme===6){ctx.fillStyle='#a3b5c158';ctx.fillRect(a,b,2,2);ctx.fillRect(a+7,b-4,1,5);ctx.fillRect(a+7,b,6,1);}
   if(theme===7){ctx.fillStyle='#ab84675c';ctx.fillRect(a,b,12,1);ctx.fillRect(a+5,b+1,2,6);}
  }
  if(basalt&&h%3===0){
   const a=x+9+h%18,b=y+5;
   for(const [dx,dy,w,h] of [[0,0,3,9],[3,7,4,3],[2,9,3,9],[3,16,5,3],[6,18,3,9],[-5,18,8,2]]){
    ctx.fillStyle=deep?'#803d5480':'#b348298c';ctx.fillRect(a+dx-1,b+dy,w+2,h);
    ctx.fillStyle=deep?'#e576668c':'#f898538c';ctx.fillRect(a+dx,b+dy,1,h);
   }
  }
  if(basalt&&h%4===0){ctx.fillStyle=deep?'#a6668848':'#b55e4b4d';const a=x+6+h%22;ctx.fillRect(a,y+21,13,1);ctx.fillRect(a+12,y+17,1,4);ctx.fillStyle='#e4a07722';ctx.fillRect(a+2,y+20,5,1);}
 }
 ctx.restore();
}
export function drawStoneWalls(ctx,obstacles,floor=0){
 if(!obstacles.some(o=>o.type==='wall'))return;
 const key=floor+':'+stamp(obstacles);let entry=surfaces.get(obstacles);
 if(!entry||entry.key!==key){
  const canvas=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(960,540):typeof document!=='undefined'?document.createElement('canvas'):null;
  if(!canvas){paintStoneWalls(ctx,obstacles,floor);return;}
  canvas.width=960;canvas.height=540;const layer=canvas.getContext('2d');if(!layer){paintStoneWalls(ctx,obstacles,floor);return;}
  paintStoneWalls(layer,obstacles,floor);const walls=obstacles.filter(o=>o.type==='wall'),x=Math.max(0,Math.floor(Math.min(...walls.map(o=>o.x)))),y=Math.max(0,Math.floor(Math.min(...walls.map(o=>o.y)))),w=Math.min(960,Math.ceil(Math.max(...walls.map(o=>o.x+o.w))))-x,h=Math.min(540,Math.ceil(Math.max(...walls.map(o=>o.y+o.h))))-y;entry={key,canvas,x,y,w,h};surfaces.delete(obstacles);surfaces.set(obstacles,entry);
  while(surfaces.size>4)surfaces.delete(surfaces.keys().next().value);
 }else{surfaces.delete(obstacles);surfaces.set(obstacles,entry);}
 const {canvas,x,y,w,h}=entry;if(w>0&&h>0)ctx.drawImage(canvas,x,y,w,h,x,y,w,h);
}
