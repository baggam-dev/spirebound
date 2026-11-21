import {movementSlowFactor} from './frost.js';
import {blocked,segmentBlocked,moveBody,steering} from '../world/terrain.js';
import {meleeIntersects} from './enemy-melee.js';
import {SUPPORT,supportTypes,interruptSupportCast} from './support-profile.js';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),bounds={minX:55,maxX:905,minY:75,maxY:465};
const livingMinions=room=>room.enemies.filter(e=>e.hp>0&&e.type==='ossuaryMinion');
export function validSupportHeal(caster,e,room){return !!e&&e!==caster&&e.hp>0&&e.hp<e.max&&!e.summoned&&e.type!=='boss'&&e.type!=='pursuer'&&!e.gateTitle&&!supportTypes.includes(e.type)&&distance(caster,e)<=SUPPORT.healRange&&!segmentBlocked(caster,e,room.obstacles,2);}
export function supportHealTarget(e,room){return room.enemies.filter(n=>validSupportHeal(e,n,room)).sort((a,b)=>a.hp/a.max-b.hp/b.max||a.id-b.id)[0]||null;}
export function supportSpawnPoint(e,p,room){
 if(room.enemies.length>=SUPPORT.enemyCap)return null;
 const minions=livingMinions(room);if(minions.length>=SUPPORT.roomCap||minions.filter(n=>n.summonOwner===e.id).length>=SUPPORT.ownerCap||(e.supportSummons||0)>=SUPPORT.totalSummons)return null;
 const aim=Math.atan2(p.y-e.y,p.x-e.x);
 for(const turn of [.8,-.8,1.6,-1.6,Math.PI])for(const reach of [70,100]){const at={x:e.x+Math.cos(aim+turn)*reach,y:e.y+Math.sin(aim+turn)*reach};if(at.x<70||at.x>890||at.y<85||at.y>455||distance(at,p)<130||blocked(at.x,at.y,SUPPORT.minionRadius,room.obstacles)||segmentBlocked(e,at,room.obstacles,2)||room.enemies.some(n=>n.hp>0&&distance(at,n)<35))continue;return at;}
 return null;
}
function summon(e,p,room){
 const at=e.supportSpawn,minions=livingMinions(room);if(!at||distance(at,p)<70||room.enemies.length>=SUPPORT.enemyCap||minions.length>=SUPPORT.roomCap||minions.filter(n=>n.summonOwner===e.id).length>=SUPPORT.ownerCap||(e.supportSummons||0)>=SUPPORT.totalSummons||blocked(at.x,at.y,15,room.obstacles)||segmentBlocked(e,at,room.obstacles,2)||room.enemies.some(n=>n.hp>0&&distance(at,n)<28))return;
 room.nextEnemyId=Math.max(room.nextEnemyId||0,0,...room.enemies.map(n=>n.id+1));const max=Math.ceil((35+(e.tier||0)*7)*(e.escapeDepth?1.4:1));
 room.enemies.push({id:room.nextEnemyId++,type:'ossuaryMinion',x:at.x,y:at.y,hp:max,max,tier:e.tier||0,escapeDepth:e.escapeDepth||0,balanceVersion:1,cd:1,spawnGrace:.6,summoned:true,summonOwner:e.id,supportLife:SUPPORT.minionLife});e.supportSummons=(e.supportSummons||0)+1;e.supportFlash={kind:'summon',time:.4,...at};
}
function heal(e,room){const target=room.enemies.find(n=>n.id===e.supportTarget);if(!validSupportHeal(e,target,room)||(e.supportHeals||0)>=SUPPORT.totalHeals)return;const amount=Math.min(target.max-target.hp,target.max*SUPPORT.healRate,SUPPORT.healCap);if(!(amount>0))return;target.hp+=amount;e.supportHeals=(e.supportHeals||0)+1;e.supportFlash={kind:'heal',time:.4,x:target.x,y:target.y,amount};}
function phase(e,name,time){e.attackPhase=name;e.attackTime=time;}
function move(e,p,room,dt){
 const d=distance(e,p);if(d>=180&&d<=300)return;
 const target=d<180?{x:Math.max(65,Math.min(895,e.x+(e.x-p.x))),y:Math.max(85,Math.min(455,e.y+(e.y-p.y)))}:p;
 const aim=steering(e,target,room.obstacles,19),speed=35*(movementSlowFactor(e));moveBody(e,Math.cos(aim)*speed*dt,Math.sin(aim)*speed*dt,room.obstacles,19,bounds);e.facing=aim;
}
export function updateSupportCaster(e,p,room,dt,bullets){
 if(!supportTypes.includes(e.type)||e.hp<=0||!(dt>0))return;
 e.supportClock=Math.max(0,(e.supportClock??2)-dt);
 if(e.type==='choirCantor'&&e.attackPhase==='supportCast'&&!validSupportHeal(e,room.enemies.find(n=>n.id===e.supportTarget),room)){interruptSupportCast(e,1.5);return;}
 if(e.attackPhase){e.attackTime=Math.max(0,e.attackTime-dt);if(e.attackTime>1e-9)return;
  const previous=e.attackPhase;
  if(previous==='supportCast'){if(e.type==='ossuarySummoner')summon(e,p,room);else heal(e,room);e.supportClock=e.type==='ossuarySummoner'?6:5.5;phase(e,'supportRelease',.2);}
  else if(previous==='supportBolt'){bullets.push({x:e.x,y:e.y,vx:Math.cos(e.aim)*165,vy:Math.sin(e.aim)*165,enemy:true,damage:9,life:2.6,hit:[],source:e.type==='ossuarySummoner'?'납골술사 봉인탄':'성가 수도사 종탄'});e.cd=2.8;phase(e,'supportRelease',.2);}
  else if(previous==='supportRelease')phase(e,'supportRecover',.45);
  else {delete e.attackPhase;delete e.attackTime;}
  if(previous==='supportCast'||previous==='supportBolt'){delete e.supportTarget;delete e.supportSpawn;delete e.supportCastHp;}return;
 }
 e.cd=Math.max(0,(e.cd??1.4)-dt);
 if(e.supportClock===0){
  if(e.type==='ossuarySummoner'){const at=supportSpawnPoint(e,p,room);if(at){e.aim=Math.atan2(at.y-e.y,at.x-e.x);e.supportSpawn=at;e.supportCastHp=e.hp;phase(e,'supportCast',SUPPORT.cast);return;}}
  else if((e.supportHeals||0)<SUPPORT.totalHeals){const target=supportHealTarget(e,room);if(target){e.aim=Math.atan2(target.y-e.y,target.x-e.x);e.supportTarget=target.id;e.supportCastHp=e.hp;phase(e,'supportCast',SUPPORT.healCast);return;}}
 }
 if(e.cd===0&&distance(e,p)<350&&!segmentBlocked(e,p,room.obstacles,3)){e.aim=Math.atan2(p.y-e.y,p.x-e.x);e.supportCastHp=e.hp;phase(e,'supportBolt',SUPPORT.boltWarning);return;}
 move(e,p,room,dt);
}
export function updateSupportMinion(e,p,room,dt,hurt){
 if(e.type!=='ossuaryMinion'||e.hp<=0||!(dt>0))return;
 if(e.attackPhase){e.attackTime=Math.max(0,e.attackTime-dt);if(e.attackPhase==='minionStrike'&&!e.minionHit){e.minionHit=true;if(meleeIntersects(e,p,e.aim,48,.9,14)&&!segmentBlocked(e,p,room.obstacles,1))hurt(9,'봉인 돌 수호체 주먹',null,e);}if(e.attackTime>1e-9)return;
  if(e.attackPhase==='minionWarning')phase(e,'minionStrike',.18);else if(e.attackPhase==='minionStrike')phase(e,'minionRecover',.7);else{delete e.attackPhase;delete e.attackTime;e.cd=.9;}return;
 }
 e.cd=Math.max(0,(e.cd??.9)-dt);if(e.cd===0&&distance(e,p)<=60&&!segmentBlocked(e,p,room.obstacles,1)){e.aim=Math.atan2(p.y-e.y,p.x-e.x);e.minionHit=false;phase(e,'minionWarning',.35);return;}
 const aim=steering(e,p,room.obstacles,15);moveBody(e,Math.cos(aim)*55*dt*(movementSlowFactor(e)),Math.sin(aim)*55*dt*(movementSlowFactor(e)),room.obstacles,15,bounds);e.facing=aim;
}
export function cleanupSupportMinions(room){for(const e of room.enemies)if(e.type==='ossuaryMinion'&&e.hp>0&&!room.enemies.some(owner=>owner.id===e.summonOwner&&owner.type==='ossuarySummoner'&&owner.hp>0)){e.hp=0;e.selfDestruct=true;e.frostShattered=true;}}
