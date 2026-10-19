import {relicStat} from './relics.js';
import {blocked,safeSpawn,segmentBlocked} from '../world/terrain.js';
export const XP_TIERS=[9,3,1];
export const XP_TIER_LIMIT=64;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function initialize(r){if(!r.xpDrops){r.xpDrops=[];r.xpNextId=0;r.xpDroppedTotal=0;r.xpCollectedTotal=0;}}
function position(origin,id,obstacles,kind,order,count,player){
 const elite=kind==='elite',boss=kind==='boss';
 const a=elite?Math.atan2(origin.y-player.y,origin.x-player.x)+(count>1?order/(count-1)-.5:0)*2.2:id*2.3999632297;
 const dist=boss?20+(order%5)*8:elite?16+(order%5)*5.5:10+(id%5)*5;
 const p={x:clamp(origin.x+Math.cos(a)*dist,34,926),y:clamp(origin.y+Math.sin(a)*dist*.7,52,488)};
 if(blocked(p.x,p.y,6,obstacles)||segmentBlocked(origin,p,obstacles,6)){p.x=clamp(origin.x,34,926);p.y=clamp(origin.y,52,488);safeSpawn(p,obstacles,6);}
 return p;
}
// Each call replaces exactly one existing XP award; no random draws or extra rewards.
export function dropXp(s,r,origin,amount,kind=origin?.elite?'elite':'normal'){
 if(s.key||!Number.isSafeInteger(amount)||amount<=0)return;
 initialize(r);r.xpDroppedTotal+=amount;let remaining=amount;
 const counts={};for(const tier of XP_TIERS){counts[tier]=Math.floor(remaining/tier);remaining%=tier;}
 // Split existing value, never add a reward. Keep these flourishes bounded.
 if(kind==='boss'&&counts[9]){counts[9]--;counts[3]+=3;}
 if((kind==='elite'||kind==='boss')&&counts[3]){counts[3]--;counts[1]+=3;}
 const count=XP_TIERS.reduce((n,t)=>n+Math.min(counts[t],XP_TIER_LIMIT-r.xpDrops.filter(d=>d.tier===t).length),0);let order=0;
 for(const tier of XP_TIERS){
  let quantity=counts[tier];if(!quantity)continue;
  const group=r.xpDrops.filter(d=>d.tier===tier),slots=Math.min(quantity,XP_TIER_LIMIT-group.length);
  for(let i=0;i<slots;i++){
   const id=r.xpNextId++,p=position(origin,id,r.obstacles||[],kind,order,count,s.player);
   const d={id,tier,value:tier,x:p.x,y:p.y,fromX:clamp(origin.x,0,960),fromY:clamp(origin.y,0,540),born:s.elapsed,attract:false,...(kind==='elite'||kind==='boss'?{burst:kind,burstOrder:order}:{})};r.xpDrops.push(d);group.push(d);order++;
  }
  quantity-=slots;
  if(quantity){const target=group.reduce((a,b)=>Math.hypot(b.x-origin.x,b.y-origin.y)<Math.hypot(a.x-origin.x,a.y-origin.y)?b:a);target.value+=quantity*tier;}
 }
 return order?kind:undefined;
}
// Attraction is physical and saved; collection removes the object before awarding its value.
export function collectXp(s,r,dt){
 if(!(dt>0)||!r.xpDrops?.length)return 0;
 const p=s.player,radius=30+relicStat(p,'pickup');let total=0;
 r.xpDrops=r.xpDrops.filter(d=>{
  if(s.elapsed-d.born<.18)return true;
  const distance=Math.hypot(p.x-d.x,p.y-d.y);
  if(segmentBlocked(d,p,r.obstacles,6)){d.attract=false;return true;}
  if(!d.attract&&distance>radius)return true;d.attract=true;
  const travel=Math.min(distance,(300+distance*2)*dt);
  if(distance<=12||distance-travel<=12){total+=d.value;return false;}
  d.x+=(p.x-d.x)*travel/distance;d.y+=(p.y-d.y)*travel/distance;return true;
 });
 if(total){r.xpCollectedTotal+=total;p.xp+=total;}
 return total;
}
