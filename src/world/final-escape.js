import {blocked} from './terrain.js';
export const FINAL_ESCAPE_DURATION=36;
export const FINAL_ESCAPE_CAP=24;
const PRESSURE_COUNTS=[4,4,5,5,6,6,7,8,9];
const PORTALS=[[100,170],[290,170],[670,170],[860,170],[860,240],[860,370],[670,370],[480,370],[290,370],[100,370],[100,280],[100,230]];
const WAVE_TIMES=[0,12,24];
const WAVE_POINTS=[
 [[140,160],[820,380],[140,380],[820,160]],
 [[140,380],[820,160],[820,380],[140,160],[480,410]],
 [[140,160],[140,380],[820,160],[820,380],[480,410],[480,235]]
];
const WAVE_TYPES=[
 ['demonBat','demonBat','demonBat','demonSoldier'],
 ['demonBat','demonBat','demonBat','demonArcher','demonSoldier'],
 ['demonBat','demonBat','demonBat','demonBat','demonArcher','demonCaptain']
];

export const finalEscapeRequired=run=>run.generationVersion>=28;
export const finalEscapeActive=room=>!!room.finalEscape&&!room.finalEscape.ready;

function spawnWave(room,wave){
 const nextId=Math.max(room.nextEnemyId||0,0,...room.enemies.map(enemy=>enemy.id+1));
 for(const [index,[x,y]] of WAVE_POINTS[wave].entries()){
  const type=WAVE_TYPES[wave][index],max=type==='demonCaptain'?260:type==='demonSoldier'?150:type==='demonArcher'?120:84;
  room.enemies.push({id:nextId+index,type,x,y,hp:max,max,cd:1+(index%2)*.25,tier:8,escapeDepth:3,
   summoned:true,spawnGrace:.7,role:'마지막 추격'});
 }
 room.nextEnemyId=nextId+WAVE_POINTS[wave].length;
}

function planPressureWave(run,room,wave){
 const state=room.finalEscape,available=Math.max(0,FINAL_ESCAPE_CAP-room.enemies.filter(e=>e.hp>0).length-state.pending.length),count=Math.min(PRESSURE_COUNTS[wave],available),points=[];
 for(let i=0;i<PORTALS.length&&points.length<count;i++){
  const [x,y]=PORTALS[(i+wave*5)%PORTALS.length];
  if(Math.hypot(x-run.player.x,y-run.player.y)<160||blocked(x,y,26,room.obstacles)||room.enemies.some(e=>e.hp>0&&Math.hypot(x-e.x,y-e.y)<48))continue;
  const type=i%4===3?(wave>=6?'demonCaptain':'demonSoldier'):i%4===2&&wave>=2?'demonArcher':'demonBat';
  points.push({x,y,type,at:wave*4+.85});
 }
 state.pending.push(...points);
}
function spawnPressurePending(run,room){
 const state=room.finalEscape,waiting=[];let alive=room.enemies.filter(e=>e.hp>0).length;
 for(const point of state.pending){if(point.at>state.elapsed){waiting.push(point);continue;}
  // Do not materialize on a player who moved into a warned portal.
  if(alive>=FINAL_ESCAPE_CAP||Math.hypot(point.x-run.player.x,point.y-run.player.y)<80)continue;
  const id=Math.max(room.nextEnemyId||0,0,...room.enemies.map(e=>e.id+1)),max=point.type==='demonCaptain'?260:point.type==='demonSoldier'?150:point.type==='demonArcher'?120:84;
  room.enemies.push({id,type:point.type,x:point.x,y:point.y,hp:max,max,cd:1,tier:8,escapeDepth:3,summoned:true,spawnGrace:.7,role:'마지막 추격'});room.nextEnemyId=id+1;alive++;
 }
 state.pending=waiting;
}

export function startFinalEscape(run,room){
 if(!finalEscapeRequired(run)||!run.key||run.floor!==0||room.type!=='exit'||room.finalEscape||room.enemies.some(e=>e.hp>0))return false;
 room.finalEscape={elapsed:0,wave:1,ready:false};
 if(run.generationVersion>=34){room.enemies=[];room.finalEscape.pressureVersion=1;room.finalEscape.pending=[];planPressureWave(run,room,0);}else spawnWave(room,0);
 return true;
}

export function tickFinalEscape(run,room,dt){
 const state=room.finalEscape;if(!state||state.ready||run.floor!==0||room.type!=='exit')return [];
 state.elapsed=Math.min(FINAL_ESCAPE_DURATION,state.elapsed+dt);
 const events=[];
 if(state.pressureVersion===1){
  spawnPressurePending(run,room);
  while(state.wave<PRESSURE_COUNTS.length&&state.elapsed>=state.wave*4){planPressureWave(run,room,state.wave++);spawnPressurePending(run,room);events.push('finalWave');}
 }else while(state.wave<WAVE_TIMES.length&&state.elapsed>=WAVE_TIMES[state.wave]){spawnWave(room,state.wave++);events.push('finalWave');}
 if(state.elapsed>=FINAL_ESCAPE_DURATION){
  state.ready=true;if(state.pressureVersion===1)state.pending=[];room.enemies=[];run.projectiles=[];events.push('finalReady');
 }
 return events;
}
