import {chargeProfile} from './balance.js';
export const encounterRoles={charger:'돌파',brute:'압박',chaser:'추격',flower:'퇴로 차단',archer:'지원 사격',scatter:'지역 제압',laser:'저격',ricochet:'측면 사격'};
export function warningActive(e){return e.hp>0&&(e.attackPhase==='warning'||e.phase==='aim'||e.phase==='windup'||e.phase==='swing'||e.eliteWarning>0||e.chargeAngle!==undefined&&e.cd>=chargeProfile(e).duration);}
export function warningCount(room,except){const ids=new Set(room.enemies.filter(n=>n!==except&&warningActive(n)).map(n=>n.id));for(const h of room.hazards||[])if(h.phase==='warning'&&h.owner!==except?.id)ids.add(h.owner);return ids.size;}
export function coordinateAttack(e,room){
 if(['boss','chaser','minislime'].includes(e.type)||e.attackPhase||e.phase||e.chargeAngle!==undefined||e.opening>0)return true;
 if(warningCount(room,e)>=2){return false;}return true;
}
export function openGuard(e,time){e.opening=Math.max(e.opening||0,time);}
export function drawOpenings(ctx,room){ctx.save();ctx.textAlign='center';ctx.font='12px sans-serif';for(const e of room.enemies)if(e.opening>0){ctx.strokeStyle='#aee2b1';ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y,30,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#d0f3c2';ctx.fillText('빈틈!',e.x,e.y-48);}ctx.restore();}
