import {criticalSkillBonuses,criticalSkillHit} from '../progression/critical-skills.js';
import {enemyDamageFactor} from './enemy-defense.js';

export const CRITICAL_DEFAULTS=Object.freeze({chance:.05,multiplier:1.5,chanceCap:.5,multiplierCap:2.5});
const queues=new WeakMap(),owners=new WeakMap(),players=new WeakMap(),UINT_MAX=4294967295;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

// Separate from runRandom: adding a critical hit cannot change map, AI or offers.
export function migrateCriticalCombat(s){
 const legacy=s.critical===undefined;
 const p=s.player;p.critChance??=CRITICAL_DEFAULTS.chance;p.critMultiplier??=CRITICAL_DEFAULTS.multiplier;
 s.critical??={version:1,randomState:((s.seed??1)^0x51f15e5d)>>>0,sequence:0,hits:0,criticalHits:0,damage:0,criticalDamage:0};
 if(players.get(p)!==s){
  // JSON duplicates shared snapshots. Rejoin active aliases once after loading
  // so gas, stacks and derived effects cannot recount the same application.
  const canonical=new Map(),visited=new WeakSet();
  const visit=value=>{
   if(!value||typeof value!=='object'||visited.has(value))return;visited.add(value);
   for(const [key,child] of Object.entries(value)){
    if(key==='criticalSnapshot'&&validCriticalSnapshot(child)){
     const previous=canonical.get(child.id);
     if(previous){if(previous.critical!==child.critical||previous.multiplier!==child.multiplier)throw Error('Conflicting critical snapshots');previous.countedTargets=[...new Set([...previous.countedTargets,...child.countedTargets])];if(previous.countedTargets.length>128)throw Error('Critical snapshot target limit');value[key]=previous;}
     else canonical.set(child.id,child);
    }else visit(child);
   }
  };visit(s);
  if(legacy){
   const profile=value=>{if(value){value.critChance??=CRITICAL_DEFAULTS.chance;value.critMultiplier??=CRITICAL_DEFAULTS.multiplier;}};
   for(const b of s.projectiles||[]){profile(b.weapon);profile(b.build);}
   for(const r of s.floors||[])for(const room of r){for(const t of room.turrets||[])profile(t.build);for(const e of room.enemies||[])profile(e.frostWeapon);}
  }
 }
 players.set(p,s);
 return s;
}
export function criticalStats(p={}){
 const chance=Number.isFinite(p.critChance)?p.critChance:CRITICAL_DEFAULTS.chance;
 const multiplier=Number.isFinite(p.critMultiplier)?p.critMultiplier:CRITICAL_DEFAULTS.multiplier;
 const bonus=criticalSkillBonuses(p);return {chance:clamp(chance+bonus.chance,0,CRITICAL_DEFAULTS.chanceCap),multiplier:clamp(multiplier+bonus.multiplier,1,CRITICAL_DEFAULTS.multiplierCap)};
}
export function createCriticalProfile(p){const stats=criticalStats(p);return {critChance:stats.chance,critMultiplier:stats.multiplier,...(p?.judgmentEmpowered?{judgmentEmpowered:true}:{})};}
export function nextCriticalRandom(s){
 migrateCriticalCombat(s);const state=s.critical;
 state.randomState=(Math.imul(state.randomState>>>0,1664525)+1013904223)>>>0;
 return state.randomState/4294967296;
}
// Serializable application/cast snapshot. Reuse it for DoT ticks, not a new roll.
export function createCriticalSnapshot(s,player=s.player){
 migrateCriticalCombat(s);if(s.critical.sequence>=UINT_MAX)throw Error('Critical sequence limit');
 const stats=criticalStats({...player,critChance:player?.critChance??s.player.critChance,critMultiplier:player?.critMultiplier??s.player.critMultiplier}),critical=stats.chance>0&&nextCriticalRandom(s)<stats.chance;
 s.critical.sequence++;
 return {version:1,id:s.critical.sequence,critical,multiplier:critical?stats.multiplier:1,countedTargets:[]};
}
// Local packet identity is never saved; each target shares one decision across
// the physical/elemental components of the same actual hit.
export const createDamagePacket=()=>new Map();
export function snapshotForTarget(s,enemy,{player=s.player,packet=null}={}){
 if(packet?.has(enemy))return packet.get(enemy);
 const snapshot=createCriticalSnapshot(s,player);packet?.set(enemy,snapshot);return snapshot;
}
function emptyResult(enemy,source){return {applied:false,enemyId:enemy?.id??null,x:enemy?.x,y:enemy?.y,source,attackId:null,attackIds:[],procDepth:0,procEligible:false,damage:0,criticalDamage:0,critical:false,newHit:false,before:enemy?.hp??0,after:enemy?.hp??0,multiplier:1};}

// Callers own range/collision checks. This gateway owns defense once, critical
// resolution, HP mutation and critical-only accounting. Existing total-DPS
// accounting is intentionally left to each caller until its migration is done.
export function applyPlayerDamage(s,enemy,amount,{player=s.player,source='direct',origin=player,snapshot=null,packet=null,components=null,defended=false,procDepth=0}={}){
 const result=emptyResult(enemy,source);
 if(!enemy||!Number.isFinite(enemy.hp)||enemy.hp<=0)return result;
 if(!Number.isInteger(procDepth)||procDepth<0||procDepth>4)throw Error('Invalid damage proc depth');
 const parts=components??[{amount,snapshot}];
 if(!Array.isArray(parts)||!parts.length||parts.some(part=>!Number.isFinite(part.amount)||part.amount<0))throw Error('Invalid player damage components');
 const base=parts.reduce((sum,part)=>sum+part.amount,0);
 if(!Number.isFinite(base)||base>1e12)throw Error('Player damage limit');
 for(const hit of [snapshot,...parts.map(part=>part.snapshot)])if(hit!==null&&hit!==undefined&&!validCriticalSnapshot(hit))throw Error('Invalid critical snapshot');
 if(!(base>0))return result;
 const defense=defended?1:enemyDamageFactor(enemy,origin);if(!(defense>0))return result;
 migrateCriticalCombat(s);
 const resolved=parts.filter(part=>part.amount>0).map(part=>({amount:part.amount,snapshot:part.snapshot??snapshot??snapshotForTarget(s,enemy,{player,packet})}));
 let damage=0,criticalDamage=0,newHit=false,critical=false;
 const id=Number.isInteger(enemy.rankingId)?enemy.rankingId:Number.isInteger(enemy.id)?enemy.id:-1;
 for(const part of resolved){
  const hit=part.snapshot;
  if(!validCriticalSnapshot(hit))throw Error('Invalid critical snapshot');
  const mark=enemy.critMarkTime>0&&enemy.critMarkAttack!==hit.id?1+(enemy.critMarkPower||0):1;
  const value=part.amount*hit.multiplier*defense*mark;damage+=value;if(hit.critical){criticalDamage+=value;critical=true;}
  if(!hit.countedTargets.includes(id)){
   if(hit.countedTargets.length>=128)throw Error('Critical snapshot target limit');
   hit.countedTargets.push(id);s.critical.hits++;if(hit.critical)s.critical.criticalHits++;newHit=true;
  }
 }
 const before=enemy.hp,actual=Math.min(before,damage),actualCritical=damage>0?actual*criticalDamage/damage:0;
 enemy.hp=before-damage;s.critical.damage+=actual;s.critical.criticalDamage+=actualCritical;
 const attackIds=[...new Set(resolved.map(part=>part.snapshot.id))];
 Object.assign(result,{applied:true,attackId:attackIds.length===1?attackIds[0]:null,attackIds,procDepth,procEligible:procDepth===0&&newHit,damage:actual,criticalDamage:actualCritical,critical,newHit,before,after:enemy.hp,multiplier:damage/(base*defense)});
 criticalSkillHit(s,enemy,result,player);
 const queue=queues.get(s)||[];queue.push({...result});if(queue.length>256)queue.splice(0,queue.length-256);queues.set(s,queue);
 return {...result,snapshot:resolved.length===1?resolved[0].snapshot:null};
}
export function drainDamageResults(s){const results=queues.get(s)||[];queues.delete(s);return results;}
export function clearDamageResults(s){queues.delete(s);}
// Context is transient, never saved on actors or weapon snapshots.
export function bindCriticalRun(s,enemies){for(const e of enemies)owners.set(e,s);}
export function bindCriticalPlayer(player,enemies){const s=players.get(player);if(s)bindCriticalRun(s,enemies);}
export function criticalInstance(enemy,instance,{player,packet=null,amount}={}){
 const s=owners.get(enemy);if(!s||!instance||!(enemy.hp>0)||amount!==undefined&&!(amount>0)||enemy.variant==='demon'&&enemy.part==='foot'&&enemy.demonShield)return instance;
 instance.criticalSnapshot??=snapshotForTarget(s,enemy,{player:player??s.player,packet});return instance;
}
export function applyBoundDamage(enemy,amount,options={}){
 const s=owners.get(enemy);
 if(s)return applyPlayerDamage(s,enemy,amount,options);
 // Compatibility for standalone legacy helpers without a run context.
 const before=enemy.hp;
 if(before<=0||!(amount>0))return emptyResult(enemy,options.source||'legacy');
 const defense=options.defended?1:enemyDamageFactor(enemy,options.origin??options.player);
 enemy.hp-=amount*defense;
 return {applied:enemy.hp<before,damage:before-Math.max(0,enemy.hp),critical:false,newHit:false,before,after:enemy.hp,multiplier:1};
}
export function validCriticalSnapshot(value){
 return !!value&&typeof value==='object'&&!Array.isArray(value)&&value.version===1&&Number.isInteger(value.id)&&value.id>=0&&value.id<=UINT_MAX&&typeof value.critical==='boolean'&&
  Number.isFinite(value.multiplier)&&value.multiplier>=1&&value.multiplier<=CRITICAL_DEFAULTS.multiplierCap&&(value.critical||value.multiplier===1)&&
  Array.isArray(value.countedTargets)&&value.countedTargets.length<=128&&new Set(value.countedTargets).size===value.countedTargets.length&&value.countedTargets.every(id=>Number.isInteger(id)&&id>=-1&&id<=1e9);
}
