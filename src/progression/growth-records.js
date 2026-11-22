import {ownedRelics} from './relics.js';
export function observeGrowth(s){const m=s.metrics??={},records=m.growthEntries??=[],phase=s.key?'descent':'ascent';if(!records.some(r=>r.floor===s.floor&&r.phase===phase)){const p=s.player;records.push({floor:s.floor,phase,level:p.level,damage:p.damage,max:p.max,relics:ownedRelics(p).length,potions:p.potions||0});}}
function currentStage(record,room,partial){
 const boss=room.enemies.find(e=>e.type==='boss'&&!e.chestBoss&&e.hp>0&&['demon','king'].includes(e.variant));
 if(!boss)return null;
 const kind=boss.variant,stage=kind==='demon'?(room.remnantBattle?room.remnantBattle.stage==='whole'?1:room.remnantBattle.stage==='split'?2:null:room.demon?.phase):boss.kingStage??1;
 if(![1,2,3].includes(stage))return null;
 const data=record.stages??={partial:partial||stage!==1,entries:[]};let entry=data.entries.find(v=>v.kind===kind&&v.stage===stage);
 if(!entry){entry={kind,stage,seconds:0,damageTaken:0,potionsUsed:0};data.entries.push(entry);}return entry;
}
function activeBossRecord(s,room){
 if(s.key||s.status!=='playing'||!room||room.type!=='boss'||room.used||!room.enemies.some(e=>e.type==='boss'&&!e.chestBoss&&e.hp>0))return null;
 const metrics=s.metrics??={},records=metrics.bossRecords??=[];let record=records.find(r=>r.floor===s.floor);
 if(record?.complete)return null;
 const legacy=!!record;
 if(!record){record={floor:s.floor,seconds:0,complete:false,resources:{damageTaken:0,potionsUsed:0,partial:false}};records.push(record);}
 if(record.entry===undefined){const p=s.player;record.entry={level:p.level,damage:p.damage,hp:p.hp,max:p.max,relics:ownedRelics(p).length,potions:p.potions||0,partial:legacy||room.remnantBattle?.stage==='split'||room.demon?.phase>1||room.enemies.some(e=>e.variant==='king'&&e.kingStage>1)};}
 // Old accumulated time cannot tell us past damage or potion use.
 record.resources??={damageTaken:0,potionsUsed:0,partial:true};return {record,stage:currentStage(record,room,legacy)};
}
export function observeBossEncounter(s){activeBossRecord(s,s.floors?.[s.floor]?.[s.room]);}
export function tickBossRecord(s,room,dt){const active=activeBossRecord(s,room);if(active){active.record.seconds+=dt;if(active.stage)active.stage.seconds+=dt;}}
export function recordBossResource(s,key,amount){
 if(!['damageTaken','potionsUsed'].includes(key)||!Number.isFinite(amount)||amount<=0)return;
 const active=activeBossRecord(s,s.floors?.[s.floor]?.[s.room]);if(active){active.record.resources[key]+=amount;if(active.stage)active.stage[key]+=amount;}
}
export function completeBossRecord(s){const record=s.metrics?.bossRecords?.find(r=>r.floor===s.floor);if(record)record.complete=true;}
function resourceMarkup(r){const v=r.resources;return v?' · 피해 '+v.damageTaken+'하트 · 물약 '+v.potionsUsed+'회'+(v.partial?' (일부 구간)':''):' · 피해·물약 미기록';}
function entryMarkup(r){const v=r.entry;return v?'<p>교전 첫 관찰 · LV '+v.level+' · 기본 공격력 '+v.damage+' · 체력 '+v.hp+'/'+v.max+'하트 · 유물 '+v.relics+' · 물약 '+v.potions+(v.partial?' (중간부터 관찰)':'')+'</p>':'<p>교전 첫 성장 상태 미기록</p>';}
function stagesMarkup(r,hunt=false){return r.stages?'<ul>'+r.stages.entries.map(v=>'<li>'+v.stage+'단계 '+(v.kind==='demon'?(hunt?['','완전체','분리된 다섯 부위'][v.stage]:['','손·발','얼굴 부위','본체'][v.stage]):['','해골왕','봉인 균열','각성'][v.stage])+' · '+v.seconds.toFixed(1)+'초 · 피해 '+v.damageTaken+'하트 · 물약 '+v.potionsUsed+'회</li>').join('')+'</ul>'+(r.stages.partial?'<p>단계 기록은 일부 구간만 포함합니다.</p>':''):'';}
export function growthRecordMarkup(s){const m=s.metrics||{};return '<h3>층별 성장 관찰</h3>'+((m.growthEntries||[]).map(r=>'<p>'+(r.floor+1)+'층 '+(r.phase==='descent'?'하강':'등반')+' · LV '+r.level+' · 기본 공격력 '+r.damage+' · 최대 체력 '+r.max+' · 유물 '+r.relics+' · 물약 '+r.potions+'</p>').join('')||'<p>아직 관찰 기록이 없습니다.</p>')+'<h3>보스 교전 기록</h3>'+((m.bossRecords||[]).map(r=>'<p>'+(r.floor+1)+'층 · '+r.seconds.toFixed(1)+'초 · '+(r.complete?'격파':'교전 중')+resourceMarkup(r)+'</p>'+entryMarkup(r)+stagesMarkup(r,s.remnantHuntVersion===1&&r.floor===7)).join('')||'<p>아직 교전 기록이 없습니다.</p>')+'<p>층별 성장은 각 층·방향의 첫 관찰, 교전 첫 관찰은 보스가 살아 있는 방에서 처음 기록한 상태입니다. 중간부터 관찰한 값은 입장 당시 상태가 아닙니다. 보스 시간·피해·물약은 등반 중 보스가 살아 있는 방에서만 누적하며 소환체·장판 피해도 포함합니다. 보호막·무적으로 막은 피해는 제외합니다. 단계 시간에는 전환 연출·공격 불가 시간도 포함됩니다. 업데이트 이전 상태·피해·물약·단계는 소급하지 않습니다.</p>';}
