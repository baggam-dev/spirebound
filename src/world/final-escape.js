export const FINAL_ESCAPE_DURATION=36;
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

export function startFinalEscape(run,room){
 if(!finalEscapeRequired(run)||!run.key||run.floor!==0||room.type!=='exit'||room.finalEscape||room.enemies.some(e=>e.hp>0))return false;
 room.finalEscape={elapsed:0,wave:1,ready:false};
 spawnWave(room,0);
 return true;
}

export function tickFinalEscape(run,room,dt){
 const state=room.finalEscape;if(!state||state.ready||run.floor!==0||room.type!=='exit')return [];
 state.elapsed=Math.min(FINAL_ESCAPE_DURATION,state.elapsed+dt);
 const events=[];
 while(state.wave<WAVE_TIMES.length&&state.elapsed>=WAVE_TIMES[state.wave]){
  spawnWave(room,state.wave++);events.push('finalWave');
 }
 if(state.elapsed>=FINAL_ESCAPE_DURATION){
  state.ready=true;room.enemies=[];run.projectiles=[];events.push('finalReady');
 }
 return events;
}
