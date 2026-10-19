import {segmentBlocked} from '../world/terrain.js';
// Shared, deterministic render/attack pose. Does not consume run RNG or write saves.
export function fairyPosition(s,index,obstacles=[]){
 const p=s.player,t=s.elapsed||0,a=t*1.15+index*Math.PI*2/3;
 const point=index===3?{x:p.x+Math.sin(t*.9)*12,y:p.y-48+Math.sin(t*1.7)*3}:{x:p.x+Math.cos(a)*30,y:p.y-26+Math.sin(a)*17+Math.sin(t*2+index)*3};
 point.x=Math.max(35,Math.min(925,point.x));point.y=Math.max(50,Math.min(485,point.y));
 if(segmentBlocked(p,point,obstacles,3))return {x:p.x,y:p.y};
 return point;
}
