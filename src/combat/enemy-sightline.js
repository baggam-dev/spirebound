import {blocked,segmentBlocked,moveBody,navigationRoute} from '../world/terrain.js';
// Navigation intentions are disposable, never saved or drawn as combat state.
const goals=new WeakMap();
export const clearEnemyShot=(e,p,obstacles=[],range=480,width=4)=>Math.hypot(e.x-p.x,e.y-p.y)<=range&&!segmentBlocked(e,p,obstacles,width);
export function enemyShotLane(e,aim,p,obstacles=[],width=4){
 const length=Math.max(24,Math.hypot(p.x-e.x,p.y-e.y));
 return !segmentBlocked(e,{x:e.x+Math.cos(aim)*length,y:e.y+Math.sin(aim)*length},obstacles,width);
}
export function seekEnemyShot(e,p,obstacles,dt,{radius=18,speed=34,range=480,preferred=270,width=4}={}){
 if(clearEnemyShot(e,p,obstacles,range,width)){goals.delete(e);return true;}
 let goal=goals.get(e);if(goal)goal.ttl-=dt;
 if(!goal||goal.obstacles!==obstacles||goal.ttl<=0||Math.hypot(goal.px-p.x,goal.py-p.y)>48){
  const base=Math.atan2(e.y-p.y,e.x-p.x),candidates=[];
  for(const distance of [preferred,Math.max(90,preferred*.55)])for(const turn of [0,.55,-.55,1.1,-1.1,1.7,-1.7,Math.PI]){
   const a=base+turn,target={x:p.x+Math.cos(a)*distance,y:p.y+Math.sin(a)*distance};
   if(target.x<40+radius||target.x>920-radius||target.y<55+radius||target.y>485-radius||blocked(target.x,target.y,radius,obstacles)||!clearEnemyShot(target,p,obstacles,range,width))continue;
   candidates.push({target,cost:Math.hypot(target.x-e.x,target.y-e.y)+Math.abs(distance-preferred)*.12});
  }
  candidates.sort((a,b)=>a.cost-b.cost);let best=null;
  // Bound graph searches per intention; a cached obstacle graph is shared by radius.
  const batch=goal?.target?0:((goal?.batch??-1)+1)%4;
  for(const candidate of candidates.slice(batch*4,batch*4+4)){const route=navigationRoute(e,candidate.target,obstacles,radius);if(Number.isFinite(route.distance)&&(!best||route.distance<best.distance))best={...candidate.target,distance:route.distance};}
  goal={target:best,batch,px:p.x,py:p.y,ttl:.4,obstacles};goals.set(e,goal);
 }
 if(!goal.target)return false;
 const route=navigationRoute(e,goal.target,obstacles,radius);if(!Number.isFinite(route.distance)){goal.ttl=0;return false;}
 const step=Math.min(route.distance,speed*dt);moveBody(e,Math.cos(route.angle)*step,Math.sin(route.angle)*step,obstacles,radius);e.facing=route.angle;
 if(route.distance<4)goal.ttl=0;
 return clearEnemyShot(e,p,obstacles,range,width);
}
