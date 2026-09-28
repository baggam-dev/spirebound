import {chargeProfile} from './balance.js';
export const encounterRoles={charger:'돌파',brute:'압박',chaser:'추격',flower:'퇴로 차단',archer:'지원 사격',scatter:'지역 제압',laser:'저격',ricochet:'측면 사격'};
export function warningActive(e){return e.hp>0&&(e.darkAttack||e.gravity?.time>1.7||e.attackPhase==='warning'||e.phase==='aim'||e.phase==='windup'||e.phase==='swing'||e.eliteWarning>0||e.chargeAngle!==undefined&&e.cd>=chargeProfile(e).duration);}
export function warningCount(room,except){const ids=new Set(room.enemies.filter(n=>n!==except&&warningActive(n)).map(n=>n.id));for(const h of room.hazards||[])if(h.phase==='warning'&&h.owner!==except?.id)ids.add(h.owner);return ids.size;}
export function coordinateAttack(e,room){
 if(['boss','chaser','minislime'].includes(e.type)||e.darkAttack||e.gravity||e.attackPhase||e.phase||e.chargeAngle!==undefined||e.opening>0)return true;
 if(warningCount(room,e)>=2){return false;}return true;
}
export function openGuard(e,time){e.opening=Math.max(e.opening||0,time);}
export function openingLabel(e){return e.counterReason==='cover'?'충돌! 반격 기회':e.counterReason==='evade'?'연속 베기 회피! 반격':e.kneel>0?'심판 종료! 반격 기회':e.type==='boss'||e.gateTitle?'공격 기회':'빈틈!';}
export function drawOpenings(ctx,room){ctx.save();ctx.textAlign='center';ctx.font='bold 12px Galmuri, monospace';for(const e of room.enemies)if(e.hp>0&&e.opening>0){const boss=e.type==='boss'||e.gateTitle,radius=boss?38:30;ctx.strokeStyle='#aee2b1';ctx.lineWidth=boss?3:2;ctx.beginPath();ctx.arc(e.x,e.y,radius,0,Math.PI*2);ctx.stroke();const label=openingLabel(e)+(boss?` · ${e.opening.toFixed(1)}초`:'');ctx.lineWidth=4;ctx.strokeStyle='#10251e';ctx.strokeText(label,e.x,e.y-48);ctx.fillStyle='#d0f3c2';ctx.fillText(label,e.x,e.y-48);if(boss){ctx.fillStyle='#10251edd';ctx.fillRect(e.x-30,e.y-39,60,5);ctx.fillStyle='#b8f5a8';ctx.fillRect(e.x-30,e.y-39,60*Math.min(1,e.opening/2.2),5);}}ctx.restore();}
