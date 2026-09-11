import {offerRelics} from './relics.js';
import {promoteElite} from './elites.js';
import {prepareReturn} from './routes.js';
import {encounter} from './encounters.js';
import {seededRandom} from './random.js';
import {strengthenEnemy} from './balance.js';
import {generateObstacles,safeSpawn} from './terrain.js';
import {MOVE_SPEED} from './progression.js';
export const dirs=[[0,-1],[1,0],[0,1],[-1,0]];
export function generateFloor(floor,random=Math.random){
 const expandable=(x,y)=>Math.abs(x)+Math.abs(y)>1&&Math.abs(x-1)+Math.abs(y)>1&&Math.abs(x)+Math.abs(y-1)>1;
 const rooms=[{x:0,y:0,type:floor===0?'exit':'down',seen:floor===0,used:false,enemies:[]}];
 for(const [x,y] of [[1,0],[2,0],[2,1],[1,1],[0,1]])rooms.push({x,y,type:'normal',seen:false,used:false,enemies:[]});
 const count=7+Math.floor(random()*4);
 while(rooms.length<count){const base=rooms[rooms.length===6||random()<.3?2:6+Math.floor(random()*(rooms.length-6))],d=dirs[Math.floor(random()*4)],x=base.x+d[0],y=base.y+d[1];if(expandable(x,y)&&!rooms.some(r=>r.x===x&&r.y===y))rooms.push({x,y,type:'normal',seen:false,used:false,enemies:[]});}
 rooms.at(-1).type=floor%2===0?'up':'normal';
 if(floor%2===1){let base=rooms.at(-1),d=dirs.find(d=>expandable(base.x+d[0],base.y+d[1])&&!rooms.some(r=>r.x===base.x+d[0]&&r.y===base.y+d[1]));while(!d){base=rooms[Math.floor(random()*rooms.length)];d=dirs.find(d=>expandable(base.x+d[0],base.y+d[1])&&!rooms.some(r=>r.x===base.x+d[0]&&r.y===base.y+d[1]));}rooms.push({x:base.x+d[0],y:base.y+d[1],type:'boss',seen:false,used:false,enemies:[]});}
 rooms[2].type='fountain';rooms[3].type='treasure';if(floor===2)rooms[4].type='shrine';if(floor===2||floor===4)rooms[floor===2?5:4].type='event';
 rooms.forEach((r,i)=>{r.obstacles=generateObstacles(floor,r.type,random);
  if(!i||['fountain','shrine','event'].includes(r.type))return;
  if(r.type==='boss'){const max=floor===5?900:floor===3?1500:825;r.enemies=[{id:0,x:480,y:210,hp:max,max,type:'boss',variant:floor===5?'slime':floor===3?'prism':undefined,stage:0,tier:floor,cd:2,balanceVersion:1,bossHealthVersion:1}];}
  else r.enemies=encounter(floor,random,r.obstacles);
 });
 if(floor>=4&&!rooms.some(r=>r.enemies.some(e=>e.type==='flower'))){const e=rooms.find(r=>r.type==='normal'&&r.enemies.length).enemies[0];e.type='flower';e.hp=e.max=Math.ceil((66+floor*12)*1.25);}
 const candidates=rooms.filter(r=>r.type==='normal'&&r.enemies.length);
 if(floor===1&&candidates.length&&random()<.75)promoteElite(candidates[Math.floor(random()*candidates.length)].enemies[0],['explosive','guardian','volley'][Math.floor(random()*3)]);
 if(floor>=2)for(const r of candidates){if(random()<.4+(floor-2)*.18)promoteElite(r.enemies[0],['explosive','guardian','volley'][Math.floor(random()*3)]);if(floor>=4&&r.enemies.length>1&&random()<.15+(floor-4)*.2)promoteElite(r.enemies[1],['explosive','guardian','volley'][Math.floor(random()*3)]);}
 if(floor===0){const r=rooms[1];r.tutorial=true;r.obstacles=[];r.enemies=Array.from({length:4},(_,i)=>({id:i,type:'chaser',x:620+(i%2)*100,y:180+Math.floor(i/2)*170,hp:54,max:54,tier:0,cd:1.5,balanceVersion:1,xpReward:i===0?11:10}));}
 return rooms;
}
export function newRun(seed=Math.floor(Math.random()*4294967296)){const random=seededRandom(seed);return {runId:(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2)),seed,randomState:seed>>>0,projectiles:[],generationVersion:17,combatVersion:17,tutorialComplete:false,rerolls:1,skillSystemVersion:14,version:1,healthVersion:1,floor:0,room:0,floors:Array.from({length:6},(_,i)=>generateFloor(i,random)),player:{x:480,y:300,hp:5,max:5,level:1,xp:0,damage:17,speed:MOVE_SPEED,fire:0,poison:0,frost:0,chain:0,haste:0,split:0,pierce:0,power:0,repeat:0,aura:0,homing:0,potions:1,food:2,weapon:0,armor:0,unique:false},elapsed:0,key:false,kills:0,attack:0,skill:0,dodge:0,invulnerable:0,pendingLevels:0,status:'playing'};}
export function currentRoom(s){return s.floors[s.floor][s.room];}
export function neighbor(s,d){const r=currentRoom(s);const next=s.floors[s.floor].findIndex(n=>n.x===r.x+dirs[d][0]&&n.y===r.y+dirs[d][1]);return s.floor===0&&s.room===0&&!s.key&&s.tutorialComplete===false&&next!==1?-1:next;}
export function enrage(s){if(s.key)return;s.key=true;const random=seededRandom((s.seed??1)^0x9e3779b9);s.floors.forEach((rooms,f)=>{prepareReturn(rooms);rooms.forEach(r=>{if(r.trialState==='active')return;if(r.type!=='boss'&&r.trialState!=='active')r.enemies=encounter(f,random,r.obstacles,s.floors.length-f);if(r.returnRisk==='low')r.enemies=r.enemies.slice(0,Math.max(4,Math.ceil(r.enemies.length*.6)));if(r.returnRisk==='high'&&r.enemies.length)promoteElite(r.enemies[0],'volley');r.hazards=[];r.blasts=[];r.fireZones=[];});});}
export function advanceClock(s,dt,paused){if(!paused&&s.status==='playing'){s.elapsed+=dt;for(const k of ['attack','skill','dodge','invulnerable','shield'])s[k]=Math.max(0,(s[k]||0)-dt);}}
export function canEscape(s){return s.key&&s.floor===0&&currentRoom(s).type==='exit';}
export function timeString(t){return `${Math.floor(t/60).toString().padStart(2,'0')}:${Math.floor(t%60).toString().padStart(2,'0')}`;}

export function ascendRoom(s){return s.floors[s.floor].find(r=>r.type==='boss')||s.floors[s.floor].find(r=>r.type==='up');}
export function travel(s,direction){
 const r=currentRoom(s),next=s.floor+direction;if(next<0||next>=s.floors.length)return false;
 if(direction===1&&!(r.type==='up'||r.type==='boss'&&r.used&&!r.enemies.length))return false;
 if(direction===-1&&r.type!=='down')return false;
 const rooms=s.floors[next],destination=direction===1?0:rooms.findIndex(r=>r.type==='up'||r.type==='boss');if(destination<0)return false;
 s.floor=next;s.room=destination;s.player.x=480;s.player.y=220;currentRoom(s).seen=true;return true;
}
export function bossDefeated(s){const r=currentRoom(s);r.used=true;if(s.floor===s.floors.length-1){enrage(s);return 'key';}offerRelics(s,r);return 'stairs';}
export function useShrine(s,choice){const r=currentRoom(s);if(r.type!=='shrine'||r.used||!['weapon','armor'].includes(choice))return false;r.used=true;if(choice==='weapon'){s.player.damage+=5;s.player.weapon++;}else{s.player.armor+=3;s.player.hp=Math.min(s.player.max,s.player.hp+1);}return true;}
