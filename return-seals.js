import {seededRandom} from './random.js';
import {promoteElite} from './elites.js';
export function prepareReturnSeals(s){
 const random=seededRandom((s.seed??1)^0x51ea19);
 for(const rooms of s.floors)for(const r of rooms){
  if(r.returnSeal!==undefined)continue;
  r.seenOnAscent=!!r.seen;
  const living=r.enemies.filter(e=>e.hp>0);
  r.returnSeal=r.type==='down'?'stairs':!r.seenOnAscent?'clear':random()<.3?'guardian':'open';
  if(r.returnSeal==='guardian'&&living.length){const e=living[Math.min(living.length-1,Math.floor(random()*living.length))];promoteElite(e,'guardian');r.returnGuardianId=e.id;}
  r.returnSealReleased=r.returnSeal==='open'||!living.length;
 }
}
export function returnSealActive(r){
 if(!r.returnSeal||r.returnSealReleased)return false;
 return r.enemies.some(e=>e.hp>0&&(r.returnSeal!=='guardian'||e.id===r.returnGuardianId));
}
export const returnDoorsLocked=r=>['clear','guardian'].includes(r.returnSeal)&&returnSealActive(r);
export const returnStairsLocked=r=>r.returnSeal==='stairs'&&returnSealActive(r);
export function releaseReturnSeal(r){if(!r.returnSeal||r.returnSealReleased||returnSealActive(r))return false;r.returnSealReleased=true;return true;}
export function returnSealText(r){if(!returnSealActive(r))return '';return r.returnSeal==='stairs'?'계단 봉인 · 적을 모두 처치하세요':r.returnSeal==='guardian'?'출구 봉쇄 · 열쇠수호자를 처치하세요':'미탐험 방 봉쇄 · 적을 모두 처치하세요';}
export function drawReturnSeal(c,r){
 if(!returnSealActive(r))return;c.save();c.textAlign='center';c.font='12px Galmuri, monospace';c.fillStyle='#f3d58c';
 if(r.returnSeal==='guardian'){const e=r.enemies.find(e=>e.id===r.returnGuardianId&&e.hp>0);if(e){const y=e.y-65;c.fillText('열쇠수호자',e.x,y);c.strokeStyle='#f3d58c';c.lineWidth=2;c.strokeRect(e.x-5,y-20,8,8);c.fillRect(e.x+3,y-17,12,3);c.fillRect(e.x+11,y-14,3,4);}}
 if(r.returnSeal==='stairs'){c.strokeStyle='#e39b83';c.lineWidth=3;c.strokeRect(450,84,60,46);for(let i=0;i<3;i++){c.beginPath();c.moveTo(452,90+i*12);c.lineTo(508,102+i*8);c.stroke();}c.fillText('봉인',480,150);}
 c.restore();
}
