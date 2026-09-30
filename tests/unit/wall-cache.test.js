import test from 'node:test';
import assert from 'node:assert/strict';
import {steering,blocked,safeSpawn,segmentBlocked} from '../../src/world/terrain.js';
import {applyRoomShape} from '../../src/world/room-shapes.js';
import {drawStoneWalls,paintStoneWalls,outerWalls} from '../../src/rendering/stone-walls.js';
function originalSteering(body,target,obstacles=[],radius=18){
 if(blocked(target.x,target.y,radius,obstacles)){target={x:target.x,y:target.y};safeSpawn(target,obstacles,radius+1);}
 if(!segmentBlocked(body,target,obstacles,radius))return Math.atan2(target.y-body.y,target.x-body.x);
 const pad=radius+3,nodes=[body,target];
 for(const o of obstacles)for(const x of [o.x-pad,o.x+o.w+pad])for(const y of [o.y-pad,o.y+o.h+pad])if(x>35&&x<925&&y>50&&y<490&&!blocked(x,y,radius,obstacles))nodes.push({x,y});
 const dist=nodes.map(()=>Infinity),prev=[],visited=new Set();dist[0]=0;
 while(visited.size<nodes.length){let at=-1;for(let i=0;i<nodes.length;i++)if(!visited.has(i)&&(at<0||dist[i]<dist[at]))at=i;if(at<0||!Number.isFinite(dist[at])||at===1)break;visited.add(at);for(let j=0;j<nodes.length;j++)if(!visited.has(j)&&!segmentBlocked(nodes[at],nodes[j],obstacles,radius)){const d=dist[at]+Math.hypot(nodes[j].x-nodes[at].x,nodes[j].y-nodes[at].y);if(d<dist[j]){dist[j]=d;prev[j]=at;}}}
 let next=1;if(prev[next]===undefined)return Math.atan2(target.y-body.y,target.x-body.x);while(prev[next]!==0)next=prev[next];return Math.atan2(nodes[next].y-body.y,nodes[next].x-body.x);
}

test('cached navigation preserves original direction across shapes, radii and geometry edits',()=>{
 for(let choice=1;choice<7;choice++){const r={type:'normal',obstacles:[]};applyRoomShape(r,choice);
 for(const radius of [14,18,22,30])for(const a of [{x:80,y:270},{x:480,y:80},{x:480,y:300}])for(const b of [{x:880,y:270},{x:480,y:460},{x:300,y:300}])assert.equal(steering(a,b,r.obstacles,radius),originalSteering(a,b,r.obstacles,radius));
 r.obstacles[0].x+=17;assert.equal(steering({x:80,y:270},{x:880,y:270},r.obstacles),originalSteering({x:80,y:270},{x:880,y:270},r.obstacles));
 }
});
test('wall image is reused, invalidated on edits and bounded across room changes',()=>{
 const previous=globalThis.OffscreenCanvas;let created=0,draws=0;const c={save(){},restore(){},beginPath(){},rect(){},clip(){},fillRect(){},drawImage(){draws++;}};
 globalThis.OffscreenCanvas=class{constructor(){created++;}getContext(){return c;}};
 try{const walls=[{x:25,y:40,w:155,h:185,type:'wall'}];drawStoneWalls(c,walls);drawStoneWalls(c,walls);assert.equal(created,1);assert.equal(draws,2);walls[0].w++;drawStoneWalls(c,walls);assert.equal(created,2);for(let i=0;i<5;i++)drawStoneWalls(c,[{...walls[0],x:i*48}]);const before=created;drawStoneWalls(c,walls);assert.equal(created,before+1);}finally{globalThis.OffscreenCanvas=previous;}
});
test('outer and inner wall faces use the same world-aligned block palette',()=>{
 const colors=new Set(),rects=[];const c={save(){},restore(){},beginPath(){},rect(){},clip(){},set fillStyle(v){colors.add(v);},fillRect(x,y,w,h){rects.push([x,y,w,h]);}};
 paintStoneWalls(c,outerWalls);paintStoneWalls(c,[{x:25,y:40,w:155,h:185,type:'wall'}]);assert.ok(colors.has('#11191b')&&colors.has('#3c4742'));assert.ok(rects.filter(r=>r[2]===46&&r[3]===38).every(([x,y])=>x%48===0&&y%40===0));
});
test('infernal masonry uses one palette for inner and outer walls and refreshes cached floor themes',()=>{
 const previous=globalThis.OffscreenCanvas,colors=new Set();let created=0;
 const c={save(){},restore(){},beginPath(){},rect(){},clip(){},drawImage(){},set fillStyle(v){colors.add(v);},fillRect(){}};
 globalThis.OffscreenCanvas=class{constructor(){created++;}getContext(){return c;}};
 try{const walls=[{x:25,y:40,w:155,h:185,type:'wall'}];paintStoneWalls(c,outerWalls,8);paintStoneWalls(c,walls,8);assert.ok(colors.has('#423636')&&colors.has('#1a171b'));drawStoneWalls(c,walls,0);drawStoneWalls(c,walls,8);drawStoneWalls(c,walls,8);drawStoneWalls(c,walls,9);assert.equal(created,3);assert.ok(colors.has('#39313d')&&colors.has('#14131c'));}finally{globalThis.OffscreenCanvas=previous;}
});
