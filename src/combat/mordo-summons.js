import {blocked} from '../world/terrain.js';
import {promoteElite} from './elites.js';
import {SKELETON,isSkeleton,skeletonWave} from './skeleton-profile.js';
const living=(r,owner)=>r.enemies.filter(e=>e.hp>0&&isSkeleton(e)&&e.summoner===owner.id);
function capacity(e,r,phase){const q=skeletonWave(phase),alive=living(r,e);return alive.length+q.count<=q.cap&&alive.filter(n=>n.elite).length<SKELETON.eliteCap&&r.enemies.filter(n=>n.hp>0).length+q.count<=SKELETON.roomCap;}
function points(e,p,r,count){
 const result=[],candidates=[];
 for(let y=100;y<=440;y+=68)for(let x=100;x<=860;x+=76)candidates.push({x,y});
 candidates.sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y));
 for(const point of candidates){if(blocked(point.x,point.y,20,r.obstacles)||Math.hypot(point.x-p.x,point.y-p.y)<160||r.enemies.some(n=>n.hp>0&&Math.hypot(point.x-n.x,point.y-n.y)<56)||result.some(n=>Math.hypot(point.x-n.x,point.y-n.y)<56))continue;result.push(point);if(result.length===count)return result;}
 return [];
}
export function tickKingSkeletonSummons(e,p,r,dt,phase,random=Math.random){
 if(e.hp<=0||e.shadowBoss===1||e.frozen>0||e.kingTransition>0)return;
 const q=skeletonWave(phase);
 if(e.skeletonSummonPhase!==phase){e.skeletonSummonPhase=phase;e.skeletonClock=q.interval-SKELETON.portalWarning;delete e.skeletonPortals;delete e.skeletonPortalTime;delete e.guardPortal;}
 if(e.skeletonPortals){
  e.skeletonPortalTime=Math.max(0,e.skeletonPortalTime-dt);
  if(e.skeletonPortalTime>0)return;
  const portals=e.skeletonPortals;delete e.skeletonPortals;delete e.skeletonPortalTime;e.skeletonClock=q.interval-SKELETON.portalWarning;
  if(!capacity(e,r,phase)||portals.some(point=>blocked(point.x,point.y,20,r.obstacles)||Math.hypot(point.x-p.x,point.y-p.y)<100||r.enemies.some(n=>n.hp>0&&Math.hypot(point.x-n.x,point.y-n.y)<48)))return;
  const types=phase===1?[random()<.5?'skeletonWarrior':'skeletonArcher']:phase===2?['skeletonWarrior','skeletonArcher']:['skeletonWarrior','skeletonWarrior','skeletonArcher','skeletonArcher'];
  const elite=Math.min(types.length-1,Math.floor(random()*types.length));
  for(const [i,type] of types.entries()){
   const id=Math.max(r.nextEnemyId||0,0,...r.enemies.map(n=>n.id+1));r.nextEnemyId=id+1;
   const max=type==='skeletonWarrior'?SKELETON.warriorHp:SKELETON.archerHp;
   const child={id,type,...portals[i],hp:max,max,cd:1,tier:9,balanceVersion:1,summoned:true,summoner:e.id,skeletonVersion:1,spawnGrace:.6,skeletonDashClock:1.5};
   if(i===elite)promoteElite(child,['guardian','explosive','volley'][Math.min(2,Math.floor(random()*3))]);
   r.enemies.push(child);
  }
  return;
 }
 e.skeletonClock=Math.max(0,(e.skeletonClock??q.interval)-dt);
 if(e.skeletonClock>0||!(dt>0))return;
 // A missed wave is skipped; no backlog is retained at a cap or blocked portal.
 e.skeletonClock=q.interval-SKELETON.portalWarning;
 if(!capacity(e,r,phase))return;const at=points(e,p,r,q.count);if(at.length!==q.count)return;
 e.skeletonPortals=at;e.skeletonPortalTime=SKELETON.portalWarning;
}
export function cleanupKingSkeletons(r,bullets=[]){
 if(r.blasts)r.blasts=r.blasts.filter(b=>b.skeletonOwner===undefined||r.enemies.some(e=>e.id===b.skeletonOwner&&e.variant==='king'&&e.hp>0&&e.shadowBoss!==1));
 for(const child of r.enemies)if(isSkeleton(child)&&!r.enemies.some(e=>e.id===child.summoner&&e.variant==='king'&&e.hp>0&&e.shadowBoss!==1)){child.hp=0;child.selfDestruct=true;child.skeletonCleanup=true;delete child.skeletonAttack;}
 for(const b of bullets)if(b.skeletonShot&&!r.enemies.some(e=>e.id===b.skeletonOwner&&e.variant==='king'&&e.hp>0&&e.shadowBoss!==1))b.life=0;
}
export function migrateKingSkeletons(s){
 for(const r of s.floors.flat()){
  const kings=r.enemies.filter(e=>e.variant==='king'&&e.shadowBoss!==1);
  for(const e of kings){delete e.guardPortal;delete e.guardClock;}
  r.enemies=r.enemies.filter(e=>!(e.summoned&&!isSkeleton(e)&&['astralSniper','pulseTurret'].includes(e.type)&&kings.some(k=>k.id===e.summoner)));
  cleanupKingSkeletons(r,s.floors[s.floor][s.room]===r?s.projectiles||[]:[]);
 }
}
