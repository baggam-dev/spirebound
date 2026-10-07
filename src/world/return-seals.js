import {safeSpawn} from './terrain.js';
import {seededRandom} from '../game/random.js';
import {promoteElite} from '../combat/elites.js';
// Graph distance, rather than room array order, covers both branches near exit.
export function finalApproachDepths(rooms){
 const exit=rooms.find(r=>r.type==='exit'),depths=new Map();if(!exit)return depths;
 const queue=[exit];depths.set(exit,0);
 for(let i=0;i<queue.length;i++){const r=queue[i],depth=depths.get(r);if(depth>=2)continue;for(const next of rooms)if(!depths.has(next)&&Math.abs(next.x-r.x)+Math.abs(next.y-r.y)===1){depths.set(next,depth+1);queue.push(next);}}
 return depths;
}
function fallbackGuardian(s,r){
 const id=Math.max(r.nextEnemyId||0,0,...r.enemies.map(e=>e.id+1));r.nextEnemyId=id+1;
 const e={id,type:'royalGuard',x:480,y:210,max:360,hp:360,tier:0,escapeDepth:s.floors.length,balanceVersion:1,cd:1.2,spawnGrace:1};safeSpawn(e,r.obstacles,19);r.enemies.push(e);return e;
}
export function prepareReturnSeals(s){
 const random=seededRandom((s.seed??1)^0x51ea19),approachRandom=seededRandom((s.seed??1)^0x7ea133),depths=s.generationVersion>=33?finalApproachDepths(s.floors[0]):new Map();
 for(const rooms of s.floors)for(const r of rooms){
  if(r.returnSeal!==undefined)continue;
  r.seenOnAscent=!!r.seen;
  const living=r.enemies.filter(e=>e.hp>0);
  r.returnSeal=r.type==='down'?'stairs':!r.seenOnAscent?'clear':random()<.3?'guardian':'open';
  if(r.returnSeal==='guardian'&&living.length){const e=living[Math.min(living.length-1,Math.floor(random()*living.length))];promoteElite(e,'guardian');r.returnGuardianId=e.id;}
  const depth=depths.get(r);
  if((depth===1||depth===2)&&r.type!=='down'){r.finalApproachDepth=depth;r.returnSeal='guardian';if(r.returnGuardianId===undefined){const e=living.length?living[Math.min(living.length-1,Math.floor(approachRandom()*living.length))]:fallbackGuardian(s,r);promoteElite(e,'guardian');r.returnGuardianId=e.id;}r.returnSealReleased=false;}
  else r.returnSealReleased=r.returnSeal==='open'||!living.length;
 }
}
export function returnSealActive(r){
 if(!r.returnSeal||r.returnSealReleased)return false;
 return r.enemies.some(e=>e.hp>0&&(r.returnSeal!=='guardian'||e.id===r.returnGuardianId));
}
export const returnDoorsLocked=r=>['clear','guardian'].includes(r.returnSeal)&&returnSealActive(r);
export const returnStairsLocked=r=>r.returnSeal==='stairs'&&returnSealActive(r);
export function releaseReturnSeal(r){if(!r.returnSeal||r.returnSealReleased||returnSealActive(r))return false;r.returnSealReleased=true;return true;}
export function returnSealText(r){if(!returnSealActive(r))return '';return r.returnSeal==='stairs'?'계단 봉인 · 적을 모두 처치하세요':r.returnSeal==='guardian'?(r.finalApproachDepth?'탈출 접근 '+r.finalApproachDepth+'방 · 열쇠수호자를 처치하세요':'출구 봉쇄 · 열쇠수호자를 처치하세요'):'미탐험 방 봉쇄 · 적을 모두 처치하세요';}
export function drawReturnSeal(c,r){
 if(!returnSealActive(r))return;c.save();c.textAlign='center';c.font='12px Galmuri, monospace';c.fillStyle='#f3d58c';
 if(r.returnSeal==='guardian'){const e=r.enemies.find(e=>e.id===r.returnGuardianId&&e.hp>0);if(e){const y=e.y-65;c.fillText(r.finalApproachDepth?'탈출 수호자 · '+r.finalApproachDepth+'방':'열쇠수호자',e.x,y);c.strokeStyle='#f3d58c';c.lineWidth=2;c.strokeRect(e.x-5,y-20,8,8);c.fillRect(e.x+3,y-17,12,3);c.fillRect(e.x+11,y-14,3,4);}}
 if(r.returnSeal==='stairs'){c.strokeStyle='#e39b83';c.lineWidth=3;c.strokeRect(450,84,60,46);for(let i=0;i<3;i++){c.beginPath();c.moveTo(452,90+i*12);c.lineTo(508,102+i*8);c.stroke();}c.fillText('봉인',480,150);}
 c.restore();
}
