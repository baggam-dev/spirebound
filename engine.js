import {prepareReturnSeals,returnDoorsLocked,returnStairsLocked} from './return-seals.js';
import {placeRoomObjects} from './object-positions.js';
import {applyRoomShape} from './room-shapes.js';
import {strengthenGateKnight} from './balance.js';
import {enterShrine,shrineLocked,claimIncantation} from './shrine.js';
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
 const count=floor===7?7:7+Math.floor(random()*4);
 while(rooms.length<count){const base=rooms[rooms.length===6||random()<.3?2:6+Math.floor(random()*(rooms.length-6))],d=dirs[Math.floor(random()*4)],x=base.x+d[0],y=base.y+d[1];if(expandable(x,y)&&!rooms.some(r=>r.x===x&&r.y===y))rooms.push({x,y,type:'normal',seen:false,used:false,enemies:[]});}
 rooms.at(-1).type=floor%2===0?'up':'normal';
 if(floor%2===1){let base=rooms.at(-1),d=dirs.find(d=>expandable(base.x+d[0],base.y+d[1])&&!rooms.some(r=>r.x===base.x+d[0]&&r.y===base.y+d[1]));while(!d){base=rooms[Math.floor(random()*rooms.length)];d=dirs.find(d=>expandable(base.x+d[0],base.y+d[1])&&!rooms.some(r=>r.x===base.x+d[0]&&r.y===base.y+d[1]));}rooms.push({x:base.x+d[0],y:base.y+d[1],type:'boss',seen:false,used:false,enemies:[]});}
 rooms[2].type='fountain';rooms[2].hasChest=random()<.25;rooms[2].chestUsed=false;rooms[3].type='treasure';if(floor===2)rooms[4].type='shrine';if(floor===2||floor===4)rooms[floor===2?5:4].type='event';
 rooms.forEach((r,i)=>{r.obstacles=generateObstacles(floor,r.type,random);
  if(!i||r.type==='event')return;
  if(r.type==='fountain'&&!r.hasChest){r.enemies=random()<.3?[]:encounter(floor,random,r.obstacles).slice(0,1+Math.floor(random()*3));return;}
  if(r.type==='boss'){const max=floor===5?1350:floor===3?2100:1155;r.enemies=[{id:0,x:480,y:210,hp:max,max,type:'boss',variant:floor===5?'slime':floor===3?'prism':undefined,stage:0,tier:floor,cd:2,balanceVersion:1,bossHealthVersion:1,bossPowerVersion:18}];}
  else r.enemies=encounter(floor,random,r.obstacles);
  if(r.type==='shrine'){r.enemies=r.enemies.slice(0,3);r.enemies.forEach((e,i)=>promoteElite(e,['explosive','guardian','volley'][i]));r.shrineState='sealed';}
 });
 if(floor>=4&&floor<6&&!rooms.some(r=>r.enemies.some(e=>e.type==='flower'))){const e=rooms.find(r=>r.type==='normal'&&r.enemies.length).enemies[0];e.type='flower';e.hp=e.max=Math.ceil((66+floor*12)*1.25);}
 const candidates=rooms.filter(r=>r.type==='normal'&&r.enemies.length);
 if(floor===1&&candidates.length&&random()<.75)promoteElite(candidates[Math.floor(random()*candidates.length)].enemies[0],['explosive','guardian','volley'][Math.floor(random()*3)]);
 if(floor>=2)for(const r of candidates){if(random()<.4+(floor-2)*.18)promoteElite(r.enemies[0],['explosive','guardian','volley'][Math.floor(random()*3)]);if(floor>=4&&r.enemies.length>1&&random()<.15+(floor-4)*.2)promoteElite(r.enemies[1],['explosive','guardian','volley'][Math.floor(random()*3)]);}
 if(floor===6){const gate=rooms.find(r=>r.type==='up');gate.gate=true;gate.obstacles=[{x:240,y:170,w:65,h:65,type:'rock'},{x:655,y:170,w:65,h:65,type:'rock'},{x:240,y:350,w:65,h:65,type:'rock'},{x:655,y:350,w:65,h:65,type:'rock'}];gate.enemies=encounter(floor,random,gate.obstacles).slice(0,2);gate.enemies.forEach((e,i)=>{e.type=i?'astralSniper':'starKnight';e.gateTitle=i?'별의 눈, 베라':'왕의 방패, 칼드';e.x=i?650:310;e.y=270;promoteElite(e,i?'volley':'guardian');e.hp=e.max=Math.ceil(e.max*3.5);e.cd=.5+i*.2;strengthenGateKnight(e);});}
 if(floor===7){const boss=rooms.find(r=>r.type==='boss');boss.enemies=[];boss.kingPending=true;const rest=rooms.find(r=>Math.abs(r.x-boss.x)+Math.abs(r.y-boss.y)===1);rest.type='fountain';rest.enemies=[];rest.obstacles=[];rest.hasChest=false;rest.rest=true;}
 if(floor>=6){const intro=rooms[1];intro.intro=true;intro.enemies=encounter(floor,random,intro.obstacles).slice(0,4);intro.enemies.forEach((e,i)=>{e.type=floor===6?(i<2?'starKnight':'astralSniper'):(i<2?'royalGuard':'pulseTurret');delete e.elite;delete e.formation;e.hp=e.max=Math.ceil((32+floor*16)*1.25*(['starKnight','royalGuard'].includes(e.type)?1.15:1));e.cd=1.2+i*.3;e.role=i<2?'전열':'후열';});}
 if(floor===0){const r=rooms[1];r.tutorial=true;r.obstacles=[];r.enemies=Array.from({length:4},(_,i)=>({id:i,type:'chaser',x:620+(i%2)*100,y:180+Math.floor(i/2)*170,hp:54,max:54,tier:0,cd:1.5,balanceVersion:1,xpReward:i===0?11:10}));}
 rooms.forEach(r=>applyRoomShape(r,Math.min(3,Math.floor(random()*4))));
 rooms.forEach(r=>placeRoomObjects(r,random));
 return rooms;
}
export function newRun(seed=Math.floor(Math.random()*4294967296)){const random=seededRandom(seed);return {runId:(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2)),seed,randomState:seed>>>0,projectiles:[],generationVersion:25,upgrade21:true,levelQueue:[],combatVersion:17,tutorialComplete:false,rerolls:1,skillSystemVersion:14,version:1,healthVersion:1,floor:0,room:0,floors:Array.from({length:8},(_,i)=>generateFloor(i,random)),player:{x:480,y:300,hp:5,max:5,level:1,xp:0,damage:17,speed:MOVE_SPEED,fire:0,poison:0,frost:0,chain:0,haste:0,split:0,pierce:0,power:0,repeat:0,aura:0,homing:0,ultimate:0,potions:1,food:2,weapon:0,armor:0,unique:false,relics:[]},elapsed:0,key:false,kills:0,attack:0,skill:0,dodge:0,invulnerable:0,pendingLevels:0,status:'playing'};}
export function currentRoom(s){return s.floors[s.floor][s.room];}
export function neighbor(s,d,roomIndex=s.room){if(s.practice)return -1;const r=s.floors[s.floor][roomIndex];const next=s.floors[s.floor].findIndex(n=>n.x===r.x+dirs[d][0]&&n.y===r.y+dirs[d][1]);return s.floor===0&&roomIndex===0&&!s.key&&s.tutorialComplete===false&&next!==1?-1:next;}
export function enrage(s){if(s.key)return;s.key=true;const random=seededRandom((s.seed??1)^0x9e3779b9);s.floors.forEach((rooms,f)=>{prepareReturn(rooms);rooms.forEach(r=>{if(r.trialState==='active'||shrineLocked(r))return;if(r.type!=='boss'&&r.trialState!=='active'){r.enemies=encounter(f,random,r.obstacles,s.floors.length-f);r.deployed=false;r.battlePotions=0;r.collectedEssences=0;}if(r.returnRisk==='low')r.enemies=r.enemies.slice(0,Math.max(4,Math.ceil(r.enemies.length*.6)));if(r.returnRisk==='high'&&r.enemies.length)promoteElite(r.enemies[0],'volley');r.hazards=[];r.blasts=[];r.fireZones=[];});});prepareReturnSeals(s);}
export function advanceClock(s,dt,paused){if(!paused&&s.status==='playing'){s.elapsed+=dt;for(const k of ['attack','skill','dodge','invulnerable','shield','auraShield','potionCooldown'])s[k]=Math.max(0,(s[k]||0)-dt);}}
export function canEscape(s){return s.key&&s.floor===0&&currentRoom(s).type==='exit'&&!roomLocked(s);}
export function timeString(t){return `${Math.floor(t/60).toString().padStart(2,'0')}:${Math.floor(t%60).toString().padStart(2,'0')}`;}

export function ascendRoom(s){return s.floors[s.floor].find(r=>r.type==='boss')||s.floors[s.floor].find(r=>r.type==='up');}
export function travel(s,direction){
 const r=currentRoom(s),next=s.floor+direction;if(next<0||next>=s.floors.length)return false;
 if(roomLocked(s,r))return false;
 if(direction===1&&!(r.type==='up'||r.type==='boss'&&r.used&&!r.enemies.length))return false;
 if(direction===-1&&(r.type!=='down'||s.key&&returnStairsLocked(r)))return false;
 const rooms=s.floors[next],destination=direction===1?0:rooms.findIndex(r=>r.type==='up'||r.type==='boss');if(destination<0)return false;
 s.floor=next;s.room=destination;s.player.x=480;s.player.y=220;currentRoom(s).seen=true;return true;
}
export function bossDefeated(s){if(s.practice){currentRoom(s).used=true;return 'practiceWon';}const r=currentRoom(s);r.used=true;offerRelics(s,r);if(s.floor===s.floors.length-1){enrage(s);s.returnNoticePending=true;return 'key';}offerRelics(s,r);return 'stairs';}
export const useShrine=claimIncantation;
export const roomLocked=(s,r=currentRoom(s))=>Boolean(s.key?returnDoorsLocked(r):(shrineLocked(r)||r.enemies.some(e=>e.hp>0)));
