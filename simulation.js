import {coordinateAttack,openGuard} from './tactics.js';
import {steerArrow,auraProfile,frostShatter} from './skill-tree.js';
import {prepareChest,prepareTrialLoot} from './loot.js';
import {tickElements,resolveFireFields} from './elements.js';
import {movementSpeed} from './relics.js';
import {observeRoom,recordDefeat,recordHit,enemyName} from './expedition.js';
import {updateElites,eliteDeath,tickBlasts} from './elites.js';
import {updatePoisonEnemy,updateHazards,splitSlime,slimeRadius} from './poison.js';
import {currentRoom,neighbor,bossDefeated,advanceClock} from './engine.js';
import {moveBody,segmentBlocked,steering,safeSpawn} from './terrain.js';
import {updateBrute} from './brute.js';
import {updatePrism} from './prism.js';
import {updatePattern} from './patterns.js';
import {updateRanged,advanceRicochet} from './ranged.js';
import {hitEnemy,tickEffects,xpRequired} from './progression.js';
import {takeDamage,killRecovery} from './survival.js';
import {ENEMY_COOLDOWN_FACTOR,CHARGE_DURATION,CHARGE_WARNING,attackProfile,chargeProfile} from './balance.js';
import {runRandom} from './random.js';

const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function collisionTime(a,b,c,radius){
 const dx=b.x-a.x,dy=b.y-a.y,ox=a.x-c.x,oy=a.y-c.y,A=dx*dx+dy*dy,C=ox*ox+oy*oy-radius*radius;
 if(C<=0)return 0;if(A===0)return Infinity;const B=2*(ox*dx+oy*dy),discriminant=B*B-4*A*C;if(discriminant<0)return Infinity;const t=(-B-Math.sqrt(discriminant))/(2*A);return t>=0&&t<=1?t:Infinity;
}
export function enemyRadius(e){return e.variant==='slime'||e.type==='minislime'?slimeRadius(e):(e.type==='boss'?32:e.type==='brute'?22:19)*(e.scale??1);}
export function enemyAirborne(e){return e.phase==='air'||e.attackPhase==='leap';}
export function ensureMetrics(s){const m=s.metrics??={};for(const [key,value] of Object.entries({damageTaken:0,damageDealt:0,shields:0,potionsUsed:0,ultimatesUsed:0,dodgesUsed:0,roomsVisited:1,floorTimes:Array(s.floors.length).fill(0)}))m[key]??=value;return m;}
export function enterRoom(s){
 const r=currentRoom(s);prepareChest(s);observeRoom(s,r);r.seen=true;ensureMetrics(s).roomsVisited=s.floors.flat().filter(r=>r.seen).length;s.projectiles=[];r.hazards=[];r.blasts=[];r.allyZone=null;r.fireZones=[];s.entryGrace=.6;
 // Do not preserve an off-screen attack aimed at the previous visit's position.
 for(const e of r.enemies){if(enemyAirborne(e)){e.x=e.landX??e.targetX??e.x;e.y=e.landY??e.targetY??e.y;safeSpawn(e,r.obstacles,enemyRadius(e));}e.eliteWarning=0;e.eliteCooldown=Math.max(1,e.eliteCooldown||0);e.phase=null;e.attackPhase=null;e.prismPhase=null;delete e.chargeAngle;e.cd=Math.max(.8,e.cd||0);e.jumpCooldown=Math.max(1,e.jumpCooldown||0);}
}
export function fireArrow(s,target){
 const p=s.player,a=Math.atan2(target.y-p.y,target.x-p.x),count=1+Math.min(4,p.split);
 const side=(s.volleySide??1);s.volleySide=-side;
 for(let i=0;i<count;i++){const offset=i===0?0:Math.ceil(i/2)*(i%2?side:-side);const angle=a+offset*(p.evolutions?.split==='fan'?.25:p.evolutions?.split==='focus'?.055:.14);s.projectiles.push({x:p.x,y:p.y,vx:Math.cos(angle)*420,vy:Math.sin(angle)*420,enemy:false,elemental:true,element:p.fire?'fire':p.poison?'poison':p.frost?'frost':p.chain?'chain':null,damageScale:i===0?1:(p.evolutions?.split==='fan'?.5:.45),homing:i<(p.homing||0),life:3,pierce:p.evolutions?.pierce==='impact'?0:p.pierce+(p.evolutions?.pierce==='depth'?2:0),hit:[]});}
 if(p.repeat){const first=s.projectiles[s.projectiles.length-count];s.projectiles.push({...first,hit:[],damageScale:.6,delay:.16,homing:count<(p.homing||0)});}
 s.attack=.65/(1+p.haste*.1+(p.bonusAttack||0))*(p.evolutions?.haste==='tempo'?.85:1)*(p.evolutions?.split==='focus'?1.15:1)*(p.relic==='rain'?1.1:1);
}
export function stepRun(s,dt,input={x:0,y:0}){
 const events=[],effects=[];if(s.status!=='playing')return {events,effects};
 if(s.player.hp<=0){events.push('dead');return {events,effects};}
 const p=s.player,metrics=ensureMetrics(s);s.projectiles??=[];advanceClock(s,dt,false);metrics.floorTimes[s.floor]=(metrics.floorTimes[s.floor]||0)+dt;
 s.entryGrace=Math.max(0,(s.entryGrace||0)-dt);let r=currentRoom(s);
 const hurt=(raw,source='알 수 없는 공격')=>{if(s.entryGrace>0||p.hp<=0)return;const before=p.hp,result=takeDamage(s,raw);metrics.damageTaken+=before-p.hp;recordHit(s,source,before-p.hp,result==='blocked');if(result==='blocked'){metrics.shields++;events.push('shield');}};
 const n=Math.max(1,Math.hypot(input.x,input.y));moveBody(p,input.x/n*movementSpeed(p)*dt,input.y/n*movementSpeed(p)*dt,r.obstacles);
 const d=p.y<48?0:p.x>930?1:p.y>492?2:p.x<30?3:-1;
 if(d>=0){const next=neighbor(s,d),aligned=d%2===0?Math.abs(p.x-480)<40:Math.abs(p.y-270)<35;
  if(next>=0&&aligned&&!((r.type==='boss'||r.tutorial&&!s.key)&&r.enemies.length)){s.room=next;r=currentRoom(s);p.x=d===1?48:d===3?912:p.x;p.y=d===0?477:d===2?63:p.y;enterRoom(s);events.push('room');}
  else{p.x=Math.max(31,Math.min(929,p.x));p.y=Math.max(49,Math.min(491,p.y));}
 }
 observeRoom(s,r);
 const elementBefore=r.enemies.reduce((n,e)=>n+Math.max(0,e.hp),0);effects.push(...tickElements(r,dt,p.poison||0));metrics.damageDealt+=elementBefore-r.enemies.reduce((n,e)=>n+Math.max(0,e.hp),0);
 tickBlasts(r,dt,p,raw=>hurt(raw,'정예 지연 폭발'));
 if(s.entryGrace<=0)updateElites(r,dt,s.projectiles,p);
 if(r.allyZone){const z=r.allyZone,active=Math.min(dt,z.time);for(const e of r.enemies)if(e.hp>0&&distance(e,z)<z.r){const before=e.hp;e.hp-=40*active*(e.protected?.5:1);metrics.damageDealt+=before-Math.max(0,e.hp);}z.time-=dt;if(z.time<=0)r.allyZone=null;}
 updateHazards(r,dt,p,raw=>hurt(raw,raw>=12?'독성 군체 독':'꽃봉우리 독'));
 const target=r.enemies.filter(e=>e.hp>0&&!enemyAirborne(e)&&!segmentBlocked(p,e,r.obstacles,3)).sort((a,b)=>distance(a,p)-distance(b,p))[0];
 if(p.aura)for(const e of r.enemies)if(e.hp>0&&!enemyAirborne(e)&&distance(e,p)<=auraProfile(p.aura).radius&&!segmentBlocked(p,e,r.obstacles,1)){const before=e.hp;e.hp-=auraProfile(p.aura).dps*dt*(e.protected?.5:1);metrics.damageDealt+=before-Math.max(0,e.hp);}
 if(target&&s.attack<=0)fireArrow(s,target);
 for(const e of r.enemies){
  const hpBefore=Math.max(0,e.hp);tickEffects(e,dt);metrics.damageDealt+=hpBefore-Math.max(0,e.hp);if(e.hp<=0||e.frozen>0)continue;
  if(e.opening>0){e.opening=Math.max(0,e.opening-dt);continue;}if(!coordinateAttack(e,r))continue;
  e.spawnGrace=Math.max(0,(e.spawnGrace||0)-dt);if(s.entryGrace>0||e.spawnGrace>0)continue;
  if(e.variant==='slime'||e.type==='flower'){updatePoisonEnemy(e,p,r,dt);continue;}
  if(e.variant==='prism'){hurt(updatePrism(e,p,r.obstacles,dt,s.projectiles),'프리즘 광선');continue;}
  if(['boss','archer','scatter'].includes(e.type)){hurt(updatePattern(e,p,r.obstacles,dt,s.projectiles,s.key),enemyName(e)+' 내려찍기');continue;}
  if(e.type==='laser'||e.type==='ricochet'){hurt(updateRanged(e,p,r.obstacles,dt,s.projectiles,s.key),enemyName(e)+' 광선');continue;}
  if(e.type==='brute'){hurt(updateBrute(e,p,r.obstacles,dt,s.key),'도약 거인 근접 공격');continue;}
  e.cd-=dt;const profile=attackProfile(e);let a=steering(e,p,r.obstacles,18),speed=52;
  if(e.type==='charger'){const charge=chargeProfile(e);if(e.cd<charge.duration+charge.warning&&e.chargeAngle===undefined)e.chargeAngle=Math.atan2(p.y-e.y,p.x-e.x);if(e.cd<charge.duration){a=e.chargeAngle??a;speed=charge.speed;}else speed=e.cd<charge.duration+charge.warning?0:35;}
  speed*=(e.trialChampion?1.15:1)*(1+(e.tier||0)*.035+(e.escapeDepth||0)*.07)*(e.slow>0?e.slowFactor:1);const beforeMove={x:e.x,y:e.y};moveBody(e,Math.cos(a)*speed*dt,Math.sin(a)*speed*dt,r.obstacles,18);if(e.type==='charger'&&e.chargeAngle!==undefined&&e.cd<chargeProfile(e).duration&&segmentBlocked(beforeMove,{x:beforeMove.x+Math.cos(a)*speed*dt,y:beforeMove.y+Math.sin(a)*speed*dt},r.obstacles,18)){openGuard(e,1.1);delete e.chargeAngle;e.cd=1.5;continue;}e.x=Math.max(40,Math.min(920,e.x));e.y=Math.max(60,Math.min(480,e.y));
  if(e.cd<=0){e.cd=Math.max(2.3*ENEMY_COOLDOWN_FACTOR*profile.recovery,e.type==='charger'?chargeProfile(e).duration+chargeProfile(e).warning+.1:0);delete e.chargeAngle;}
  if(distance(e,p)<23&&!segmentBlocked(e,p,r.obstacles,0))hurt(e.type==='charger'?18:9,enemyName(e)+(e.type==='charger'?' 돌진':' 접촉'));
 }
 // A lethal hit ends the simulation before drops or life-steal can heal the player.
 if(p.hp<=0){events.push('dead');return {events,effects};}
 for(const b of s.projectiles){
  if(b.life<=0)continue;
  if(b.ricochet){if(advanceRicochet(b,dt,r.obstacles,p))hurt(12,b.source||'반사탄');if(p.hp<=0)break;continue;}
  let travelDt=dt;if(b.delay>0){travelDt=Math.max(0,dt-b.delay);b.delay=Math.max(0,b.delay-dt);if(b.delay>0)continue;b.x=p.x;b.y=p.y;}if(!b.enemy)steerArrow(b,r.enemies,r.obstacles,travelDt,segmentBlocked);
  const next={x:b.x+b.vx*travelDt,y:b.y+b.vy*travelDt};b.life-=travelDt;
  if(b.enemy){const t=collisionTime(b,next,p,15);if(t!==Infinity&&!segmentBlocked(b,{x:b.x+(next.x-b.x)*t,y:b.y+(next.y-b.y)*t},r.obstacles,3)){hurt(b.damage??10,b.source||'적 탄환');b.life=0;}}
  else{
   const candidates=r.enemies.filter(e=>e.hp>0&&!enemyAirborne(e)&&!b.hit.includes(e.id)).map(e=>({e,t:collisionTime(b,next,e,enemyRadius(e))})).filter(h=>h.t!==Infinity).sort((a,b)=>a.t-b.t);
   for(const {e,t} of candidates){if(e.hp<=0)continue;const impact={x:b.x+(next.x-b.x)*t,y:b.y+(next.y-b.y)*t};if(segmentBlocked(b,impact,r.obstacles,3))break;const before=r.enemies.reduce((sum,e)=>sum+Math.max(0,e.hp),0);effects.push(...hitEnemy(b.frostShard?{...p,fire:0,poison:0,chain:0,frost:p.frost>=3?p.frost:0}:p,e,r.enemies,r.obstacles,b.damageScale??1,b.frostShard?p.frost>=3:b.elemental!==false,r));metrics.damageDealt+=before-r.enemies.reduce((sum,e)=>sum+Math.max(0,e.hp),0);b.elemental=false;b.hit.push(e.id);if(b.pierce--<=0){b.life=0;break;}}
  }
  if(segmentBlocked(b,next,r.obstacles,3))b.life=0;b.x=next.x;b.y=next.y;if(p.hp<=0)break;
 }
 s.projectiles=s.projectiles.filter(b=>b.life>0&&b.x>25&&b.x<935&&b.y>40&&b.y<500);
 if(p.hp<=0){events.push('dead');return {events,effects};}
 r.nextEnemyId=Math.max(r.nextEnemyId||0,...r.enemies.map(e=>e.id+1));
 resolveFireFields(r);
 const defeated=r.enemies.filter(e=>e.hp<=0);r.enemies=r.enemies.filter(e=>e.hp>0);
 for(const e of defeated){
  frostShatter(p,e,s.projectiles);recordDefeat(s,e);
  if(e.summoned)continue;
  if(splitSlime(e,r))continue;
  if(e.chestBoss){s.kills++;continue;}
  if(eliteDeath(e,r)){p.potions++;events.push('eliteReward');}
  s.kills++;
  if(e.type!=='boss'&&killRecovery(s,r,false,()=>runRandom(s)))events.push('potion');
  if(!s.key&&e.type!=='boss'){p.xp+=e.xpReward??12;}
 }
 if(r.type==='boss'&&defeated.some(e=>e.type==='boss'&&!e.chestBoss)&&!r.enemies.some(e=>e.type==='boss')&&!r.used){
  r.enemies=r.enemies.filter(e=>!e.summoned);r.hazards=[];s.projectiles=[];
  if(!s.key)p.xp+=45;events.push(bossDefeated(s));
 }
 while(p.xp>=xpRequired(p.level)){p.xp-=xpRequired(p.level);p.level++;s.pendingLevels++;}

 if(r.tutorial&&!s.key&&!r.enemies.length)s.tutorialComplete=true;
 if(r.chestBattle==='active'&&!r.enemies.some(e=>!e.summoned)){r.chestBattle='done';r.enemies=[];r.hazards=[];s.projectiles=[];}
 if(r.trialState==='active'&&!r.enemies.length){r.trialState='reward';prepareTrialLoot(s);events.push('trialReward');}
 if(s.pendingLevels)events.push('level');return {events,effects};
}
