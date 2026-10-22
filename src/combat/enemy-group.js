import {blocked,segmentBlocked,steering,moveBody} from '../world/terrain.js';
import {replaceEnemyMovementGoals,enemyMovementGoal,enemyMovementLocked} from '../world/enemy-movement-goals.js';
const melee=new Set(['chaser','charger','brute','starKnight','royalGuard','riftHunter','ambusher','demonSoldier','demonCaptain']);
const ranged=new Set(['archer','scatter','laser','ricochet','astralSniper','demonArcher','strafer','gravityMage','starBearer']);
const rooms=new WeakMap(),cell=80;
const key=(x,y)=>Math.floor(x/cell)+','+Math.floor(y/cell);
function gridOf(actors){const grid=new Map();for(const e of actors){const k=key(e.x,e.y);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(e);}return grid;}
function nearby(grid,x,y){const found=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const bucket=grid.get(key(x+dx*cell,y+dy*cell));if(bucket)for(const e of bucket){found.push(e);if(found.length>=48)return found;}}return found;}
const radius=e=>e.type==='brute'?22:e.type==='demonCaptain'?24:18;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function prepareEnemyGroup(room,player,dt){
 let state=rooms.get(room);
 if(state&&state.player===player&&state.obstacles===room.obstacles&&state.enemies===room.enemies&&(state.time-=dt)>0&&distance(state,player)<32){replaceEnemyMovementGoals(state.goals);return;}
 const living=room.enemies.filter(e=>e.hp>0),grid=gridOf(living),reserved=new Map(),goals=new WeakMap();
 for(const e of living.filter(e=>e.type!=='boss'&&!e.gateTitle&&(melee.has(e.type)||ranged.has(e.type))).sort((a,b)=>distance(a,player)-distance(b,player)||a.id-b.id)){
  if(enemyMovementLocked(e))continue;
  const neighbors=nearby(grid,e.x,e.y).filter(n=>n!==e&&distance(n,e)<60).slice(0,18),push={x:0,y:0};
  for(const n of neighbors){const d=distance(n,e),a=d>1e-6?Math.atan2(e.y-n.y,e.x-n.x):(e.id<n.id?0:Math.PI),weight=Math.max(0,1-d/48);push.x+=Math.cos(a)*weight;push.y+=Math.sin(a)*weight;}
  const length=Math.hypot(push.x,push.y);if(length>1){push.x/=length;push.y/=length;}
  const rear=ranged.has(e.type),range=rear?(e.type==='starBearer'?210:270):['starKnight','royalGuard','riftHunter'].includes(e.type)?100:e.type==='chaser'?40:50,theta=Math.atan2(e.y-player.y,e.x-player.x);
  let target=null,best=Infinity;
  // A limited sector on the current side avoids instantly surrounding the player.
  if(living.length>1)for(const turn of [0,.36,-.36,.72,-.72,1.08,-1.08]){
   const point={x:player.x+Math.cos(theta+turn)*range,y:player.y+Math.sin(theta+turn)*range},r=radius(e);
   if(point.x<45+r||point.x>915-r||point.y<60+r||point.y>480-r||blocked(point.x,point.y,r,room.obstacles)||segmentBlocked(e,point,room.obstacles,r)||segmentBlocked(point,player,room.obstacles,rear?4:0))continue;
   const occupancy=nearby(reserved,point.x,point.y).reduce((n,p)=>n+Math.max(0,52-distance(p,point))*5,0),bodies=nearby(grid,point.x,point.y).reduce((n,p)=>n+(p!==e?Math.max(0,38-distance(p,point))*2:0),0),cost=distance(e,point)+Math.abs(turn)*12+occupancy+bodies;
   if(cost<best){best=cost;target=point;}
  }
  if(target){const k=key(target.x,target.y);if(!reserved.has(k))reserved.set(k,[]);reserved.get(k).push(target);}
  goals.set(e,{player,target:target||player,push,rear,positioned:!!target});
 }
 state={player,obstacles:room.obstacles,enemies:room.enemies,time:.25,x:player.x,y:player.y,goals};rooms.set(room,state);replaceEnemyMovementGoals(goals);
}
// Only deferred, idle actors use this. No clock, aim, damage or player mutation.
export function moveWaitingEnemy(e,player,room,dt){
 const goal=enemyMovementGoal(e,player);if(!goal||distance(e,goal.target)<18)return;
 const a=steering(e,player,room.obstacles,radius(e)),speed=(e.type==='brute'?40:25)*(e.slow>0?(e.slowFactor??1):1),step=Math.min(3,Math.max(0,dt)*speed,distance(e,goal.target));
 moveBody(e,Math.cos(a)*step,Math.sin(a)*step,room.obstacles,radius(e),{minX:45,maxX:915,minY:60,maxY:480});
}
