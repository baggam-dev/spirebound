import {ownedRelics} from './relics.js';
export function observeGrowth(s){const m=s.metrics??={},records=m.growthEntries??=[],phase=s.key?'descent':'ascent';if(!records.some(r=>r.floor===s.floor&&r.phase===phase)){const p=s.player;records.push({floor:s.floor,phase,level:p.level,damage:p.damage,max:p.max,relics:ownedRelics(p).length,potions:p.potions||0});}}
function activeBossRecord(s,room){
 if(s.key||s.status!=='playing'||!room||room.type!=='boss'||room.used||!room.enemies.some(e=>e.type==='boss'&&!e.chestBoss&&e.hp>0))return null;
 const metrics=s.metrics??={},records=metrics.bossRecords??=[];let record=records.find(r=>r.floor===s.floor);
 if(record?.complete)return null;
 if(!record){record={floor:s.floor,seconds:0,complete:false,resources:{damageTaken:0,potionsUsed:0,partial:false}};records.push(record);}
 // Old accumulated time cannot tell us past damage or potion use.
 record.resources??={damageTaken:0,potionsUsed:0,partial:true};return record;
}
export function tickBossRecord(s,room,dt){const record=activeBossRecord(s,room);if(record)record.seconds+=dt;}
export function recordBossResource(s,key,amount){
 if(!['damageTaken','potionsUsed'].includes(key)||!Number.isFinite(amount)||amount<=0)return;
 const record=activeBossRecord(s,s.floors?.[s.floor]?.[s.room]);if(record)record.resources[key]+=amount;
}
export function completeBossRecord(s){const record=s.metrics?.bossRecords?.find(r=>r.floor===s.floor);if(record)record.complete=true;}
function resourceMarkup(r){const v=r.resources;return v?' · 피해 '+v.damageTaken+'하트 · 물약 '+v.potionsUsed+'회'+(v.partial?' (일부 구간)':''):' · 피해·물약 미기록';}
export function growthRecordMarkup(s){const m=s.metrics||{};return '<h3>층별 성장 관찰</h3>'+((m.growthEntries||[]).map(r=>'<p>'+(r.floor+1)+'층 '+(r.phase==='descent'?'하강':'등반')+' · LV '+r.level+' · 기본 공격력 '+r.damage+' · 최대 체력 '+r.max+' · 유물 '+r.relics+' · 물약 '+r.potions+'</p>').join('')||'<p>아직 관찰 기록이 없습니다.</p>')+'<h3>보스 교전 기록</h3>'+((m.bossRecords||[]).map(r=>'<p>'+(r.floor+1)+'층 · '+r.seconds.toFixed(1)+'초 · '+(r.complete?'격파':'교전 중')+resourceMarkup(r)+'</p>').join('')||'<p>아직 교전 기록이 없습니다.</p>')+'<p>성장은 각 층·방향에서 처음 관찰한 값입니다. 보스 시간·피해·물약은 등반 중 보스가 살아 있는 방에서만 누적하며 소환체·장판 피해도 포함합니다. 보호막·무적으로 막은 피해는 제외합니다. 업데이트 이전 피해·물약은 소급하지 않습니다.</p>';}
