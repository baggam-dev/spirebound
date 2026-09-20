import {strengthenEnemy} from './balance.js';
import {blocked,safeSpawn} from './terrain.js';
export const formations=[
 {id:'sniper',name:'저격 진형',min:6,units:['starKnight','astralSniper','starKnight','chaser']},
 {id:'gravity',name:'인력 사냥',min:6,units:['gravityMage','starKnight','pulseTurret','chaser']},
 {id:'escort',name:'별의 호위대',min:6,units:['starBearer','chaser','starKnight','astralSniper']},
 {id:'crossfire',name:'교차 사격',min:6,units:['astralSniper','charger','archer','starKnight']},
 {id:'vanguard',name:'성운 전열',min:6,units:['starKnight','chaser','scatter','charger']},
 {id:'pursuit',name:'별빛 추격대',min:6,units:['gravityMage','chaser','charger','astralSniper']},
 {id:'royal',name:'왕실 근위대',min:7,units:['royalGuard','pulseTurret','royalGuard','archer']},
 {id:'rift',name:'균열 습격대',min:7,units:['riftHunter','royalGuard','pulseTurret','chaser']},
 {id:'court',name:'마지막 궁정',min:7,units:['starBearer','royalGuard','astralSniper','riftHunter']}
];
const support=new Set(['starBearer','gravityMage']);
export const frontliner=type=>['chaser','charger','brute','starKnight','royalGuard','riftHunter','ambusher'].includes(type);
export function upperEncounter(floor,random,obstacles=[],escapeDepth=0){const pool=formations.filter(f=>f.min<=floor),form=pool[Math.floor(random()*pool.length)];const count=escapeDepth?7+escapeDepth+Math.floor(random()*2):4+Math.floor(floor*.65)+Math.floor(random()*3);let supports=0;return Array.from({length:count},(_,id)=>{let type=form.units[id%form.units.length];if(support.has(type)){if(supports>=1)type=floor===7?'royalGuard':'chaser';else supports++;}const base=32+(escapeDepth?5:floor)*16,max=Math.ceil(base*(escapeDepth?1.35+escapeDepth*.1:1)*(['starKnight','royalGuard'].includes(type)?1.15:1));const e={id,type,formation:form.id,role:support.has(type)?'지원':frontliner(type)?'전열':'후열',x:frontliner(type)?280+random()*150:610+random()*170,y:120+random()*290,hp:max,max,cd:(support.has(type)?2.2:frontliner(type)?1:1.6)+(id%3)*.35+random()*.15,tier:floor,escapeDepth};safeSpawn(strengthenEnemy(e),obstacles,22);return e;});}
export function deployRoom(room,player){if(room.deployed||room.type==='boss'||room.tutorial||room.gate)return;const dx=480-player.x,dy=270-player.y,len=Math.hypot(dx,dy)||1,fx=dx/len,fy=dy/len,placed=[];for(const e of room.enemies){const depth=frontliner(e.type)?210+(e.id%2)*50:340+(e.id%2)*45,side=((e.id%4)-1.5)*95,target={x:player.x+fx*depth-fy*side,y:player.y+fy*depth+fx*side};const spots=[];for(let y=95;y<=445;y+=35)for(let x=90;x<=880;x+=35)if(!blocked(x,y,24,room.obstacles)&&Math.hypot(x-player.x,y-player.y)>=155&&placed.every(n=>Math.hypot(x-n.x,y-n.y)>=48))spots.push({x,y});spots.sort((a,b)=>Math.hypot(a.x-target.x,a.y-target.y)-Math.hypot(b.x-target.x,b.y-target.y));const point=spots[0];if(point){e.x=point.x;e.y=point.y;placed.push(point);}}room.deployed=true;}
export function formationName(room){return formations.find(f=>f.id===room.enemies.find(e=>e.formation)?.formation)?.name||'';}
