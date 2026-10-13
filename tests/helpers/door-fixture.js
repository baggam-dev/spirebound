export function edgeTo(s,from,to){const rooms=s.floors[s.floor],a=rooms[from],b=rooms[to];return [[0,-1],[1,0],[0,1],[-1,0]].findIndex(([x,y])=>b.x-a.x===x&&b.y-a.y===y);}
export function atExit(s,d){const r=s.floors[s.floor][s.room],n=r.doorPositions[d];Object.assign(s.player,{x:d===1?931:d===3?29:n,y:d===0?47:d===2?493:n});return {x:d===1?1:d===3?-1:0,y:d===0?-1:d===2?1:0};}
