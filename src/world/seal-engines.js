import {seededRandom} from '../game/random.js';
import {blocked,segmentBlocked} from './terrain.js';
import {doorCenter,doorDirections} from './doors.js';
import {dropXp} from '../progression/xp-drops.js';

export const SEAL_ENGINE={warning:1.2,release:.24,recover:3,grace:2,disarm:1.2,range:42,speed:330,reward:18};
const source='봉인 기관 석궁';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function engineLane(d,r){
 const start={x:d.x+d.direction*24,y:d.y};let length=0;
 for(let n=4;n<=760;n+=4){const p={x:start.x+d.direction*n,y:start.y};if(p.x<36||p.x>924||segmentBlocked(start,p,r.obstacles,3))break;length=n;}
 return {start,end:{x:start.x+d.direction*length,y:start.y},length};
}
function placement(rooms,r){
 for(const direction of [1,-1])for(const y of [130,410,210,330]){
  const d={x:direction===1?70:890,y,direction};const side=direction===1?3:1,dir=doorDirections[side];
  if(rooms.some(n=>n.x===r.x+dir[0]&&n.y===r.y+dir[1])&&Math.abs(doorCenter(r,side)-y)<100)continue;
  if(blocked(d.x,d.y,32,r.obstacles)||blocked(d.x+direction*32,d.y,22,r.obstacles)||engineLane(d,r).length<240)continue;
  return d;
 }
 return null;
}
export function planSealEngines(s){
 if(s.sealEngineVersion===1)return;s.sealEngineVersion=1;if(s.practice||(s.generationVersion||0)<25)return;
 for(let floor=2;floor<=Math.min(7,s.floors.length-1);floor++){
  const rooms=s.floors[floor],random=seededRandom(((s.seed??1)^Math.imul(floor+1,0x231ac573))>>>0);if(random()>=.55)continue;
  const candidates=rooms.map((r,index)=>({r,index})).filter(({r,index})=>r.type==='normal'&&!r.gate&&!r.footprint&&!r.tutorial&&!r.hasChest&&!r.deployed&&!r.seen&&!r.used&&r.enemies.length>=3&&!(floor===s.floor&&index===s.room)&&!r.specialEncounter&&!r.pursuerEncounter&&!r.supportEncounter);
  while(candidates.length){const {r}=candidates.splice(Math.floor(random()*candidates.length),1)[0],at=placement(rooms,r);if(!at)continue;r.sealEngine={version:1,...at,disabled:false,rewarded:false,phase:'rest',time:SEAL_ENGINE.grace,disarm:0};break;}
 }
}
export function resetSealEngine(r){const d=r.sealEngine;if(!d)return;d.disarm=0;d.phase=d.disabled?'disabled':'rest';d.time=d.disabled?0:SEAL_ENGINE.grace;}
export function silenceSealEngine(s,r){if(!r.sealEngine)return;resetSealEngine(r);s.projectiles=(s.projectiles||[]).filter(b=>b.source!==source);}
export function disableSealEngine(s,r,effects=[]){
 const d=r.sealEngine;if(!d||d.disabled)return false;d.disabled=true;d.phase='disabled';d.time=0;d.disarm=0;
 s.projectiles=(s.projectiles||[]).filter(b=>b.source!==source);
 if(!d.rewarded){d.rewarded=true;dropXp(s,r,{x:d.x+d.direction*30,y:d.y},SEAL_ENGINE.reward);effects.push({x:d.x,y:d.y-36,t:1,color:'#b5d7bd',text:'봉인 기관 해제 · 18XP'});}
 return true;
}
export function tickSealEngine(s,r,dt,input,effects=[]){
 const d=r.sealEngine;if(!d||d.disabled)return;
 const p=s.player,near=distance(p,d)<=SEAL_ENGINE.range&&!segmentBlocked(p,d,r.obstacles,2),still=Math.hypot(input.x||0,input.y||0)<.05&&!s.roll&&!(p.actionStun>0);
 d.disarm=near&&still?Math.min(SEAL_ENGINE.disarm,d.disarm+dt):0;
 if(d.disarm>=SEAL_ENGINE.disarm){disableSealEngine(s,r,effects);return;}
 if(!r.enemies.some(e=>e.hp>0&&!e.summoned)){d.phase='rest';d.time=SEAL_ENGINE.grace;s.projectiles=(s.projectiles||[]).filter(b=>b.source!==source);return;}
 if(s.entryGrace>0)return;
 d.time=Math.max(0,d.time-dt);if(d.time>0)return;
 if(d.phase==='rest'){if(engineLane(d,r).length<40){d.time=SEAL_ENGINE.recover;return;}d.phase='warning';d.time=SEAL_ENGINE.warning;}
 else if(d.phase==='warning'){
  const {start,length}=engineLane(d,r);if(length>=4)(s.projectiles??=[]).push({...start,vx:d.direction*SEAL_ENGINE.speed,vy:0,life:length/SEAL_ENGINE.speed,enemy:true,damage:9,source,hit:[]});
  d.phase='release';d.time=SEAL_ENGINE.release;
 }else{d.phase='rest';d.time=SEAL_ENGINE.recover;}
}
export function validateSealEngines(s,check,number){
 if(s.sealEngineVersion!==undefined)check(s.sealEngineVersion===1);
 for(const [floor,rooms] of s.floors.entries()){
  check(rooms.filter(r=>r.sealEngine).length<=1);
  for(const r of rooms){const d=r.sealEngine;if(d===undefined)continue;
   check(s.sealEngineVersion===1&&!s.practice&&floor>=2&&floor<=7&&r.type==='normal'&&!r.gate&&!r.hasChest&&!r.footprint&&!r.tutorial);
   check(d&&d.version===1&&[1,-1].includes(d.direction)&&d.x===(d.direction===1?70:890)&&[130,410,210,330].includes(d.y));
   check(typeof d.disabled==='boolean'&&typeof d.rewarded==='boolean'&&d.disabled===d.rewarded);
   const max={rest:3,warning:1.2,release:.24,disabled:0}[d.phase];check(max!==undefined&&number(d.time,0,max)&&number(d.disarm,0,SEAL_ENGINE.disarm));
   check(d.disabled?d.phase==='disabled'&&d.disarm===0:d.phase!=='disabled');
  }
 }
}
