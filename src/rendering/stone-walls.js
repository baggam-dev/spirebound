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
export function paintStoneWalls(ctx,obstacles){
 const walls=obstacles.filter(o=>o.type==='wall');if(!walls.length)return;
 ctx.save();ctx.beginPath();for(const o of walls)ctx.rect(o.x,o.y,o.w,o.h);ctx.clip();
 ctx.fillStyle='#11191b';for(const o of walls)ctx.fillRect(o.x,o.y,o.w,o.h);
 // Same world-aligned blocks for outer and inner walls; no separate trim or brick texture.
 ctx.fillStyle='#3c4742';
 const cells=new Set();for(const o of walls)for(let y=Math.floor(o.y/40)*40;y<o.y+o.h;y+=40)for(let x=Math.floor(o.x/48)*48;x<o.x+o.w;x+=48){const key=y*960+x;if(cells.has(key))continue;cells.add(key);ctx.fillRect(x,y,46,38);}
 ctx.restore();
}
export function drawStoneWalls(ctx,obstacles){
 if(!obstacles.some(o=>o.type==='wall'))return;
 const key=stamp(obstacles);let entry=surfaces.get(obstacles);
 if(!entry||entry.key!==key){
  const canvas=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(960,540):typeof document!=='undefined'?document.createElement('canvas'):null;
  if(!canvas){paintStoneWalls(ctx,obstacles);return;}
  canvas.width=960;canvas.height=540;const layer=canvas.getContext('2d');if(!layer){paintStoneWalls(ctx,obstacles);return;}
  paintStoneWalls(layer,obstacles);const walls=obstacles.filter(o=>o.type==='wall'),x=Math.max(0,Math.floor(Math.min(...walls.map(o=>o.x)))),y=Math.max(0,Math.floor(Math.min(...walls.map(o=>o.y)))),w=Math.min(960,Math.ceil(Math.max(...walls.map(o=>o.x+o.w))))-x,h=Math.min(540,Math.ceil(Math.max(...walls.map(o=>o.y+o.h))))-y;entry={key,canvas,x,y,w,h};surfaces.delete(obstacles);surfaces.set(obstacles,entry);
  while(surfaces.size>4)surfaces.delete(surfaces.keys().next().value);
 }else{surfaces.delete(obstacles);surfaces.set(obstacles,entry);}
 const {canvas,x,y,w,h}=entry;if(w>0&&h>0)ctx.drawImage(canvas,x,y,w,h,x,y,w,h);
}
