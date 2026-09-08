import {generateObstacles,safeSpawn} from './terrain.js';
import {MOVE_SPEED} from './progression.js';
export const dirs=[[0,-1],[1,0],[0,1],[-1,0]];
export function generateFloor(floor,random=Math.random){
 const rooms=[{x:0,y:0,type:floor===0?'exit':'down',seen:true,used:false,enemies:[]}];
 const count=7+Math.floor(random()*4);
 while(rooms.length<count){const base=rooms[Math.floor(random()*rooms.length)],d=dirs[Math.floor(random()*4)],x=base.x+d[0],y=base.y+d[1];if(!rooms.some(r=>r.x===x&&r.y===y))rooms.push({x,y,type:'normal',seen:false,used:false,enemies:[]});}
 rooms.at(-1).type=floor%2===0?'up':'normal';
 if(floor%2===1){let base=rooms.at(-1),d=dirs.find(d=>!rooms.some(r=>r.x===base.x+d[0]&&r.y===base.y+d[1]));while(!d){base=rooms[Math.floor(random()*rooms.length)];d=dirs.find(d=>!rooms.some(r=>r.x===base.x+d[0]&&r.y===base.y+d[1]));}rooms.push({x:base.x+d[0],y:base.y+d[1],type:'boss',seen:false,used:false,enemies:[]});}
 rooms[2].type='fountain';rooms[3].type='treasure';if(floor===2)rooms[4].type='shrine';
 rooms.forEach((r,i)=>{if(i&&!['fountain','shrine'].includes(r.type))r.enemies=Array.from({length:r.type==='boss'?1:4+floor+Math.floor(random()*3)},(_,n)=>({id:n,x:220+random()*500,y:110+random()*280,hp:r.type==='boss'?(floor===3?1000:550):32+floor*12,max:r.type==='boss'?(floor===3?1000:550):32+floor*12,type:r.type==='boss'?'boss':['chaser','archer','charger','scatter'][n%4],variant:floor===3&&r.type==='boss'?'prism':undefined,cd:1+random()*2}));});let rangedRoom=0;rooms.forEach(r=>{r.obstacles=generateObstacles(floor,r.type,random);if(floor>0&&r.type!=='boss'&&r.enemies.length){const brute=r.enemies[0];brute.type='brute';brute.hp=brute.max=150;if(r.enemies.length>1){const specialist=r.enemies[1];specialist.type=rangedRoom++%2===0?'ricochet':'laser';specialist.hp=specialist.max=65;specialist.cd=2.5;}}r.enemies.forEach(e=>safeSpawn(e,r.obstacles,e.type==='boss'?32:e.type==='brute'?22:18));});return rooms;
}
export function newRun(){return {version:1,floor:0,room:0,floors:Array.from({length:4},(_,i)=>generateFloor(i)),player:{x:480,y:300,hp:100,max:100,level:1,xp:0,damage:17,speed:MOVE_SPEED,fire:0,frost:0,chain:0,haste:0,split:0,pierce:0,potions:1,food:2,weapon:0,armor:0,unique:false},elapsed:0,key:false,kills:0,attack:0,skill:0,dodge:0,invulnerable:0,pendingLevels:0,status:'playing'};}
export function currentRoom(s){return s.floors[s.floor][s.room];}
export function neighbor(s,d){const r=currentRoom(s);return s.floors[s.floor].findIndex(n=>n.x===r.x+dirs[d][0]&&n.y===r.y+dirs[d][1]);}
export function enrage(s){if(s.key)return;s.key=true;s.floors.forEach(rooms=>rooms.forEach(r=>{if(r.type!=='boss')r.enemies=Array.from({length:3},(_,id)=>({id,x:180+id*250,y:150,hp:48,max:48,type:id===1?'charger':'chaser',cd:1}));r.enemies.forEach(e=>safeSpawn(e,r.obstacles));}));}
export function advanceClock(s,dt,paused){if(!paused&&s.status==='playing'){s.elapsed+=dt;for(const k of ['attack','skill','dodge','invulnerable'])s[k]=Math.max(0,s[k]-dt);}}
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
export function bossDefeated(s){const r=currentRoom(s);r.used=true;if(s.floor===s.floors.length-1){enrage(s);return 'key';}return 'stairs';}
export function useShrine(s,choice){const r=currentRoom(s);if(r.type!=='shrine'||r.used||!['weapon','armor'].includes(choice))return false;r.used=true;if(choice==='weapon'){s.player.damage+=12;s.player.weapon++;}else{s.player.armor+=3;s.player.max+=30;s.player.hp=Math.min(s.player.max,s.player.hp+30);}return true;}
