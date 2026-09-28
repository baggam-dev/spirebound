export function route(rooms,start,end,cost=()=>1,seenOnly=false){
 const dist=rooms.map(()=>Infinity),prev=[],visited=new Set();dist[start]=0;
 for(let n=0;n<rooms.length;n++){let at=-1;for(let i=0;i<rooms.length;i++)if(!visited.has(i)&&(at<0||dist[i]<dist[at]))at=i;if(at<0||!Number.isFinite(dist[at]))return [];if(at===end)break;visited.add(at);rooms.forEach((r,j)=>{if(seenOnly&&!r.seen||Math.abs(r.x-rooms[at].x)+Math.abs(r.y-rooms[at].y)!==1)return;const next=dist[at]+cost(r);if(next<dist[j]){dist[j]=next;prev[j]=at;}});}
 if(!Number.isFinite(dist[end]))return [];const path=[end];while(path[0]!==start){path.unshift(prev[path[0]]);if(path[0]===undefined)return [];}return path;
}
export function prepareReturn(rooms){
 const start=rooms.findIndex(r=>r.type==='boss'||r.type==='up'),short=route(rooms,start,0);
 rooms.forEach((r,i)=>{r.returnRisk=i===0||i===start?'normal':short.includes(i)?'high':'low';if(r.type==='fountain')r.returnRisk='low';});
}
export function returnRoutes(s){const rooms=s.floors[s.floor];return {short:route(rooms,s.room,0,()=>1,true),safe:route(rooms,s.room,0,r=>r.returnRisk==='high'?6:r.returnRisk==='low'?1:2,true)};}
