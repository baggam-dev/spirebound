import {applyRoomShape,roomShapeNames} from '../../src/world/room-shapes.js';
import {steering,blocked,segmentBlocked} from '../../src/world/terrain.js';
import {drawStoneWalls} from '../../src/rendering/stone-walls.js';
// Fixed valid positions and warmed batches; isolates cost, not full-game FPS.
const rows=[];
for(let shape=0;shape<7;shape++){
 const r={type:'normal',obstacles:[],enemies:[]};applyRoomShape(r,shape);
 let fills=0;const ctx={save(){},restore(){},beginPath(){},rect(){},fill(){},clip(){},fillRect(){fills++;}};drawStoneWalls(ctx,r.obstacles);
 const points=[];for(let y=90;y<=450;y+=60)for(let x=90;x<=870;x+=60)if(!blocked(x,y,22,r.obstacles))points.push({x,y});
 const pairs=[];for(let i=0;i<points.length;i++)for(let j=0;j<points.length;j+=7)if(i!==j)pairs.push([points[i],points[j]]);
 const groups={clear:pairs.filter(([a,b])=>!segmentBlocked(a,b,r.obstacles,18)).slice(0,100),blocked:pairs.filter(([a,b])=>segmentBlocked(a,b,r.obstacles,18)).slice(0,100)};
 const row={shape:roomShapeNames[shape],walls:r.obstacles.length,fillRects:fills};
 for(const [name,ps] of Object.entries(groups)){if(!ps.length){row[name]=null;continue;}for(let k=0;k<5;k++)for(const [a,b] of ps)steering(a,b,r.obstacles);const times=[];for(let k=0;k<9;k++){const t=performance.now();for(let repeat=0;repeat<10;repeat++)for(const [a,b] of ps)steering(a,b,r.obstacles);times.push((performance.now()-t)/(ps.length*10));}times.sort((a,b)=>a-b);row[name]={medianMs:times[4],maxBatchMs:times[8]};}
 rows.push(row);
}
console.log(JSON.stringify(rows,null,2));
