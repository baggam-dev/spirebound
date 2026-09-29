// Cache static room geometry; rendering never consumes gameplay randomness.
const geometry=new WeakMap();
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
export function drawStoneWalls(ctx,obstacles){
 let data=geometry.get(obstacles);
 if(!data){
  const walls=obstacles.filter(o=>o.type==='wall');
  data={walls,edges:stoneWallEdges(walls)};geometry.set(obstacles,data);
 }
 const {walls,edges}=data;if(!walls.length)return;
 ctx.save();ctx.beginPath();for(const o of walls)ctx.rect(o.x,o.y+6,o.w,o.h);ctx.fillStyle='#080e1290';ctx.fill();
 ctx.beginPath();for(const o of walls)ctx.rect(o.x,o.y,o.w,o.h);ctx.fillStyle='#505a55';ctx.fill();ctx.clip();
 // Staggered, low-contrast masonry shares one grid across adjacent collision rectangles.
 const left=Math.min(...walls.map(o=>o.x)),right=Math.max(...walls.map(o=>o.x+o.w)),top=Math.min(...walls.map(o=>o.y)),bottom=Math.max(...walls.map(o=>o.y+o.h));
 for(let row=Math.floor(top/22);row*22<bottom;row++)for(let col=Math.floor(left/44)-1;col*44<right;col++){
  const x=col*44+(row%2)*22,y=row*22,seed=Math.abs((row*73856093)^(col*19349663));
  ctx.fillStyle=['#586158','#4f5a54','#5b655c','#525d56'][seed%4];ctx.fillRect(x+1,y+1,42,20);
  ctx.fillStyle='#9da38b55';ctx.fillRect(x+2,y+1,40,1);ctx.fillStyle='#333f38';ctx.fillRect(x,y,44,1);ctx.fillRect(x,y,1,22);
  if(seed%11===0){ctx.fillStyle='#37443c';ctx.fillRect(x+25,y+4,2,6);ctx.fillRect(x+23,y+9,3,2);}
  if(seed%17===0){ctx.fillStyle='#78826066';ctx.fillRect(x+4,y+14,9,3);ctx.fillRect(x+8,y+12,7,2);}
 }
 for(const e of edges){const size=e.end-e.start;
  if(e.side==='top'){ctx.fillStyle='#8d937b';ctx.fillRect(e.start,e.axis,size,2);ctx.fillStyle='#667165';ctx.fillRect(e.start,e.axis+2,size,2);}
  if(e.side==='left'){ctx.fillStyle='#747f6e';ctx.fillRect(e.axis,e.start,2,size);}
  if(e.side==='right'){ctx.fillStyle='#334039';ctx.fillRect(e.axis-3,e.start,3,size);}
  if(e.side==='bottom'){ctx.fillStyle='#303f39';ctx.fillRect(e.start,e.axis-8,size,8);ctx.fillStyle='#6c7567';ctx.fillRect(e.start,e.axis-8,size,1);ctx.fillStyle='#1a2622';ctx.fillRect(e.start,e.axis-2,size,2);}
 }
 ctx.restore();
}
