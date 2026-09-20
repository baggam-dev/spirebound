import {upperEncounter} from './formations.js';
import {promoteElite} from './elites.js';
import {encounterRoles} from './tactics.js';
import {strengthenEnemy} from './balance.js';
import {safeSpawn} from './terrain.js';

const groups=[['chaser','archer','scatter'],['charger','archer','chaser'],['scatter','charger','chaser'],['brute','ricochet','archer'],['brute','laser','charger'],['laser','scatter','chaser'],['flower','charger','archer'],['flower','brute','ricochet']];
export function encounter(floor,random,obstacles=[],escapeDepth=0,returnVariants=!!escapeDepth){
 if(floor>=6)return upperEncounter(floor,random,obstacles,escapeDepth);
 const pool=groups.slice(0,escapeDepth||floor>=4?8:floor>=1?6:3);if(!escapeDepth&&floor>=2)pool.push(['charger','brute','archer'],['brute','charger','scatter']);const group=pool[Math.floor(random()*pool.length)];
 const count=escapeDepth?7+escapeDepth+Math.floor(random()*2):4+Math.floor(floor*.65)+Math.floor(random()*3);
 const level=escapeDepth?5:floor;
 const enemies=Array.from({length:count},(_,id)=>{
  const type=group[id%group.length],base=type==='brute'?120+level*14:type==='flower'?66+level*12:32+level*16;
  const max=Math.ceil(base*(escapeDepth?1.35+escapeDepth*.1:1));
  const e={id,type,x:['chaser','charger','brute'].includes(type)?170+random()*310:540+random()*250,y:125+random()*290,hp:max,max,cd:1+(id%3)*.45+random()*.35,tier:floor,escapeDepth};
  e.role=encounterRoles[type];
  safeSpawn(strengthenEnemy(e),obstacles,type==='brute'?22:19);return e;
 });
 if(returnVariants){const types=['strafer','ringcaster','ambusher'],kind=types[Math.floor(random()*types.length)];for(const [i,e] of enemies.entries())if(i%4===1){e.type=kind;e.role='귀환 매복';}}
 if(escapeDepth&&returnVariants&&floor<6&&random()<.3){const pools=[['astralSniper','starKnight'],['gravityMage','royalGuard'],['pulseTurret','riftHunter']],types=pools[Math.floor(floor/2)];const e=enemies.at(-1);e.type=types[Math.floor(random()*types.length)];e.role='상층의 추격자';}
 if(!escapeDepth&&floor>=2&&floor<=5&&random()<.12){const types=['astralSniper','gravityMage','starKnight','royalGuard','pulseTurret','riftHunter'];const e=enemies.at(-1);e.type=types[Math.floor(random()*types.length)];e.role='상층 원정대';}
 // A support-led pack creates a priority target, with nearby weaker escorts.
 if(floor>=2&&!escapeDepth&&group[0]==='chaser'){
  promoteElite(enemies[0],'guardian');enemies[0].role='수호 핵심';
  for(const e of enemies.slice(1,4)){e.x=enemies[0].x+(e.id%2?65:-65);e.y=Math.max(90,Math.min(450,enemies[0].y+e.id*22));e.x=Math.max(90,Math.min(870,e.x));safeSpawn(e,obstacles,19);}
 }
 return enemies;
}
