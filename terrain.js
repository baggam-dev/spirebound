const directions=[[0,-1],[1,0],[0,1],[-1,0]];
export function roomDoors(rooms,room){return directions.map(([x,y])=>rooms.some(n=>n.x===room.x+x&&n.y===room.y+y));}
// Four separated islands preserve a wide central cross and perimeter paths.
export function generateObstacles(floor,type,random=Math.random){
 if(type==='boss'||type==='exit'||type==='down'||random()>Math.min(.8,.4+floor*.15))return [];
 const slots=[[260,180],[650,180],[260,360],[650,360]];
 for(let i=slots.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[slots[i],slots[j]]=[slots[j],slots[i]];}
 return slots.slice(0,1+Math.floor(random()*Math.min(4,2+floor))).map(([x,y])=>({x:x-35+random()*25,y:y-25+random()*15,w:60+Math.floor(random()*25),h:40+Math.floor(random()*20),type:['rock','bookshelf','table','bones'][Math.floor(random()*4)]}));
}
export function blocked(x,y,r,obstacles=[]){return obstacles.some(o=>x>o.x-r&&x<o.x+o.w+r&&y>o.y-r&&y<o.y+o.h+r);}
export function segmentBlocked(a,b,obstacles=[],radius=0){
 return obstacles.some(o=>{let lo=0,hi=1;for(const [start,delta,min,max] of [[a.x,b.x-a.x,o.x-radius,o.x+o.w+radius],[a.y,b.y-a.y,o.y-radius,o.y+o.h+radius]]){if(Math.abs(delta)<1e-9){if(start<min||start>max)return false;}else{const t1=(min-start)/delta,t2=(max-start)/delta;lo=Math.max(lo,Math.min(t1,t2));hi=Math.min(hi,Math.max(t1,t2));if(lo>hi)return false;}}return true;});
}
export function moveBody(body,dx,dy,obstacles=[],radius=14){
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/5));
 for(let i=0;i<steps;i++){if(!blocked(body.x+dx/steps,body.y,radius,obstacles))body.x+=dx/steps;if(!blocked(body.x,body.y+dy/steps,radius,obstacles))body.y+=dy/steps;}
}
export function safeSpawn(body,obstacles=[],radius=18){
 if(!blocked(body.x,body.y,radius,obstacles))return;
 let best=null;for(let y=90;y<=450;y+=20)for(let x=100;x<=860;x+=20)if(!blocked(x,y,radius,obstacles)&&(!best||Math.hypot(x-body.x,y-body.y)<best.d))best={x,y,d:Math.hypot(x-body.x,y-body.y)};
 if(best){body.x=best.x;body.y=best.y;}
}
// Small visibility graph: deterministic routing around obstacle corners.
export function steering(body,target,obstacles=[],radius=18){
 if(blocked(target.x,target.y,radius,obstacles)){target={x:target.x,y:target.y};safeSpawn(target,obstacles,radius+1);}
 if(!segmentBlocked(body,target,obstacles,radius))return Math.atan2(target.y-body.y,target.x-body.x);
 const pad=radius+3,nodes=[body,target];
 for(const o of obstacles)for(const x of [o.x-pad,o.x+o.w+pad])for(const y of [o.y-pad,o.y+o.h+pad])if(x>35&&x<925&&y>50&&y<490&&!blocked(x,y,radius,obstacles))nodes.push({x,y});
 const dist=nodes.map(()=>Infinity),prev=[],visited=new Set();dist[0]=0;
 while(visited.size<nodes.length){let at=-1;for(let i=0;i<nodes.length;i++)if(!visited.has(i)&&(at<0||dist[i]<dist[at]))at=i;if(at<0||!Number.isFinite(dist[at])||at===1)break;visited.add(at);for(let j=0;j<nodes.length;j++)if(!visited.has(j)&&!segmentBlocked(nodes[at],nodes[j],obstacles,radius)){const d=dist[at]+Math.hypot(nodes[j].x-nodes[at].x,nodes[j].y-nodes[at].y);if(d<dist[j]){dist[j]=d;prev[j]=at;}}}
 let next=1;if(prev[next]===undefined)return Math.atan2(target.y-body.y,target.x-body.x);while(prev[next]!==0)next=prev[next];return Math.atan2(nodes[next].y-body.y,nodes[next].x-body.x);
}
export function drawObstacles(ctx,obstacles=[]){
 for(const o of obstacles){const {x,y,w,h}=o;ctx.fillStyle='#0007';ctx.fillRect(x-3,y+7,w+6,h);ctx.fillStyle='#17201e';ctx.fillRect(x-2,y-2,w+4,h+4);
 if(o.type==='wall'){ctx.fillStyle='#11191f';ctx.fillRect(x,y,w,h);ctx.fillStyle='#43504e';ctx.fillRect(x,y,w,4);ctx.fillRect(x,y,4,h);ctx.fillStyle='#293736';ctx.fillRect(x+w-4,y,4,h);ctx.fillRect(x,y+h-4,w,4);for(let yy=8;yy<h-5;yy+=24)for(let xx=8;xx<w-5;xx+=36){ctx.fillStyle='#202c2e';ctx.fillRect(x+xx,y+yy,Math.min(30,w-xx-4),Math.min(18,h-yy-4));}continue;}
 if(o.type==='rock'){ctx.fillStyle='#647169';ctx.fillRect(x+8,y,w-16,h);ctx.fillRect(x,y+10,w,h-20);ctx.fillStyle='#8c9480';ctx.fillRect(x+12,y+5,w-30,7);ctx.fillStyle='#414e49';ctx.fillRect(x+20,y+22,5,h-27);}
 if(o.type==='bookshelf'){ctx.fillStyle='#685239';ctx.fillRect(x,y,w,h);for(let row=0;row<2;row++){ctx.fillStyle='#282b25';ctx.fillRect(x+5,y+6+row*23,w-10,18);for(let i=0;i<Math.floor((w-12)/10);i++){ctx.fillStyle=['#9b6e58','#708980','#aea071'][i%3];ctx.fillRect(x+8+i*10,y+8+row*23,6,14);}}}
 if(o.type==='table'){ctx.fillStyle='#43372a';ctx.fillRect(x+4,y+h-5,8,9);ctx.fillRect(x+w-12,y+h-5,8,9);ctx.fillStyle='#91734d';ctx.fillRect(x,y,w,h-4);ctx.fillStyle='#b09463';ctx.fillRect(x+4,y+4,w-8,4);ctx.fillStyle='#5f4a32';ctx.fillRect(x+4,y+h/2,w-8,2);ctx.fillStyle='#bcb99b';ctx.fillRect(x+w/2,y+12,14,10);}
 if(o.type==='bones'){ctx.fillStyle='#4b5149';ctx.fillRect(x,y,w,h);ctx.fillStyle='#c2b99a';ctx.fillRect(x+8,y+h/2-3,w-16,6);for(let i=0;i<4;i++){ctx.fillRect(x+12+i*12,y+9,5,h-18);}ctx.fillStyle='#e0d3ab';ctx.fillRect(x+w-22,y+12,19,22);ctx.fillStyle='#353e36';ctx.fillRect(x+w-18,y+17,4,6);ctx.fillRect(x+w-10,y+17,4,6);}
 }
}
export function drawMinimap(ctx,rooms,current,path=[],doorsForRoom=r=>roomDoors(rooms,r)){
 const visible=rooms.filter(r=>r.seen);if(!visible.length)return;
 ctx.fillStyle='#08120f99';ctx.fillRect(772,12,166,160);ctx.strokeStyle='#91a18a66';ctx.lineWidth=1;ctx.strokeRect(772.5,12.5,166,160);
 ctx.textAlign='center';ctx.font='10px Galmuri, monospace';ctx.fillStyle='#c1cdb9';ctx.fillText(rooms.some(r=>r.returnRisk)?'귀환 · 빨강 위험 / 초록 우회':'탐색 지도 · 문 위치',855,28);
 const minX=Math.min(...visible.map(r=>r.x)),minY=Math.min(...visible.map(r=>r.y)),width=Math.max(...visible.map(r=>r.x))-minX+1,height=Math.max(...visible.map(r=>r.y))-minY+1,step=Math.min(28,142/width,125/height),size=step*.68;
 const ox=855-width*step/2,oy=38+(125-height*step)/2;
 for(const r of visible){const x=ox+(r.x-minX)*step+(step-size)/2,y=oy+(r.y-minY)*step+(step-size)/2;ctx.fillStyle=r===current?'#cfbb83':r.returnRisk==='high'?'#a35d53':r.returnRisk==='low'?'#4c876b':'#536d60';ctx.fillRect(x,y,size,size);if(path.includes(rooms.indexOf(r))){ctx.strokeStyle='#f4dc85';ctx.lineWidth=2;ctx.strokeRect(x-1,y-1,size+2,size+2);}
 doorsForRoom(r).forEach((open,i)=>{if(!open)return;ctx.fillStyle='#e7dcaf';const [dx,dy]=directions[i],cx=x+size/2+dx*size/2,cy=y+size/2+dy*size/2;ctx.fillRect(cx-(dx?1.5:2.5),cy-(dy?1.5:2.5),dx?3:5,dy?3:5);});
 const symbol=r.hasChest?'~◆':({up:'↑',down:'↓',boss:'!',exit:'⌂',treasure:'◆',fountain:'~',shrine:'†',event:'?'})[r.type];if(symbol){ctx.fillStyle=r.type==='fountain'&&r.used?'#88948a':'#f3e9c8';ctx.font=`${Math.min(11,size-2)}px Galmuri, monospace`;ctx.fillText(symbol,x+size/2,y+size/2+3);}
 }
}
