import {strengthenEnemy} from '../combat/balance.js';
import {blocked,safeSpawn} from './terrain.js';
export const formations=[
 {id:'hive',name:'군체 포위',min:5,theme:5,units:['flower','charger','flower','chaser']},
 {id:'hiveRush',name:'군체 돌격',min:5,theme:5,units:['brute','chaser','charger','flower']},
 {id:'hiveAmbush',name:'군체 매복',min:5,theme:5,units:['flower','ricochet','charger','chaser']},
 {id:'sniper',name:'저격 진형',min:6,units:['starKnight','astralSniper','starKnight','chaser']},
 {id:'gravity',name:'인력 사냥',min:6,units:['gravityMage','starKnight','pulseTurret','chaser']},
 {id:'escort',name:'별의 호위대',min:6,units:['starBearer','chaser','starKnight','astralSniper']},
 {id:'crossfire',name:'교차 사격',min:6,units:['astralSniper','charger','archer','starKnight']},
 {id:'vanguard',name:'성운 전열',min:6,units:['starKnight','chaser','scatter','charger']},
 {id:'pursuit',name:'별빛 추격대',min:6,units:['gravityMage','chaser','charger','astralSniper']},
 {id:'royal',name:'왕실 근위대',min:7,units:['royalGuard','pulseTurret','royalGuard','archer']},
 {id:'rift',name:'균열 습격대',min:7,units:['riftHunter','royalGuard','pulseTurret','chaser']},
 {id:'court',name:'마지막 궁정',min:7,units:['starBearer','royalGuard','astralSniper','riftHunter']},
 {id:'siege',name:'별빛 포위대',min:6,units:['starKnight','ricochet','pulseTurret','charger']},
 {id:'garden',name:'봉쇄된 관측소',min:6,units:['laser','starKnight','scatter','chaser']},
 {id:'hunt',name:'왕실 사냥대',min:7,units:['gravityMage','riftHunter','archer','royalGuard']},
 {id:'bulwark',name:'왕좌의 방벽',min:7,units:['starBearer','royalGuard','ricochet','brute']},
 {id:'infernalRush',name:'지옥 첨병',min:8,theme:8,units:['demonSoldier','demonBat','demonArcher','demonSoldier']},
 {id:'infernalNest',name:'심연의 가시밭',min:8,theme:8,units:['spikeNest','demonSoldier','demonArcher','demonSoldier']},
 {id:'infernalGuard',name:'악마 부대',min:8,theme:8,units:['demonCaptain','demonSoldier','demonArcher','demonBat']},
 {id:'infernalSwarm',name:'폭렬 박쥐 떼',min:8,theme:8,units:['demonBat','demonSoldier','spikeNest','demonSoldier']}
];
const support=new Set(['starBearer','gravityMage']);
export const frontliner=type=>['chaser','charger','brute','starKnight','royalGuard','riftHunter','ambusher','demonBat','demonSoldier','demonCaptain'].includes(type);
export function formationPool(floor){
 const available=formations.filter(f=>f.min<=floor),theme=Math.min(8,Math.max(5,floor));
 const focus=available.filter(f=>(f.theme??(f.min===7?7:6))===theme);
 // Most rooms announce their own floor; older packs remain a smaller surprise.
 return [...Array.from({length:9},()=>focus).flat(),...available.filter(f=>!focus.includes(f))];
}
export function upperEncounter(floor,random,obstacles=[],escapeDepth=0){const pool=formationPool(floor),form=pool[Math.floor(random()*pool.length)];const count=escapeDepth?7+escapeDepth+Math.floor(random()*2):4+Math.floor(floor*.65)+Math.floor(random()*3);let supports=0;return Array.from({length:count},(_,id)=>{let type=form.units[id%form.units.length];if(support.has(type)){if(supports>=1)type=floor>=7?'royalGuard':'chaser';else supports++;}const base=32+(escapeDepth?5:floor)*16,multiplier=type==='demonBat'?.37:type==='spikeNest'?.8:type==='demonCaptain'?1.7:['starKnight','royalGuard','demonSoldier'].includes(type)?1.15:1,max=Math.ceil(base*(escapeDepth?1.35+escapeDepth*.1:1)*multiplier);const e={id,type,formation:form.id,role:support.has(type)?'지원':frontliner(type)?'전열':'후열',x:frontliner(type)?280+random()*150:610+random()*170,y:120+random()*290,hp:max,max,cd:(support.has(type)?2.2:frontliner(type)?1:1.6)+(id%3)*.35+random()*.15,tier:floor,escapeDepth};safeSpawn(strengthenEnemy(e),obstacles,type==='demonCaptain'?24:type==='demonBat'?14:22);return e;});}
const crossfire=new Set(['crossfire','siege','hunt']);
const pincer=new Set(['pursuit','rift','infernalRush']);
export function deploymentOffset(e,version=29){
 const front=frontliner(e.type);
 if(version>=30&&crossfire.has(e.formation))return front?{depth:205+(e.id%2)*35,side:(e.id%2?1:-1)*75}:{depth:265+(e.id%2)*20,side:(Math.floor(e.id/2)%2?1:-1)*230};
 if(version>=30&&pincer.has(e.formation))return front?{depth:175+(e.id%2)*20,side:(e.id%2?1:-1)*145}:{depth:340,side:(e.id%2?1:-1)*55};
 return {depth:front?210+(e.id%2)*50:340+(e.id%2)*45,side:((e.id%4)-1.5)*95};
}
export function deployRoom(room,player,version=29){
 if(room.deployed||room.type==='boss'||room.tutorial||room.gate)return;
 const dx=480-player.x,dy=270-player.y,len=Math.hypot(dx,dy)||1,fx=dx/len,fy=dy/len,placed=[];
 for(const e of room.enemies){
  const {depth,side}=deploymentOffset(e,version),target={x:player.x+fx*depth-fy*side,y:player.y+fy*depth+fx*side};
  const spots=[];for(let y=95;y<=445;y+=35)for(let x=90;x<=880;x+=35)if(!blocked(x,y,24,room.obstacles)&&Math.hypot(x-player.x,y-player.y)>=155&&placed.every(n=>Math.hypot(x-n.x,y-n.y)>=48))spots.push({x,y});
  spots.sort((a,b)=>Math.hypot(a.x-target.x,a.y-target.y)-Math.hypot(b.x-target.x,b.y-target.y));const point=spots[0];if(point){e.x=point.x;e.y=point.y;placed.push(point);}
 }
 room.deployed=true;
}
export function formationName(room){return formations.find(f=>f.id===room.enemies.find(e=>e.formation)?.formation)?.name||'';}
