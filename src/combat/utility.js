import {utilityAvailable} from '../progression/skill-overhaul.js';
export const utilitySkills=[
 {id:'focus',name:'마혈 각성',description:'1하트 소모 · 7초 공속 +70% / 이속 +25% · 재사용 25초'},
 {id:'firstAid',name:'혈월의 계약',description:'8초간 5처치 또는 보스 최대체력 10% 피해마다 1하트 회복 · 회당 최대 2하트 · 재사용 30초'},
 {id:'guardian',name:'성역의 구체',description:'10초 동안 구체 쉴드가 피격 1회 방어 · 재사용 25초'}
];
export function chooseUtility(s,id){if(s.status!=='playing'||s.player.actionStun>0||!utilityAvailable(s)||s.player.utility||!utilitySkills.some(k=>k.id===id))return false;s.player.utility=id;s.utilityCooldown=0;return true;}
export function canCastUtility(s){return s.status==='playing'&&!(s.player.actionStun>0)&&!!s.player.utility&&!(s.utilityCooldown>0)&&(s.player.utility!=='focus'||s.player.hp>1);}
export function castUtility(s){
 const id=s.player.utility;if(!canCastUtility(s))return false;
 if(id==='firstAid'){
  s.bloodTime=8;s.bloodKills=0;s.bloodCredits=0;s.bloodHeals=0;s.bloodBossHealth={};for(const e of s.floors[s.floor][s.room].enemies)if(e.type==='boss')s.bloodBossHealth[e.id]={hp:Math.max(0,e.hp),max:e.max};s.utilityCooldown=30;
 }else if(id==='focus'){s.player.hp--;s.player.focusTime=7;s.utilityCooldown=25;}
 else if(id==='guardian'){s.guardianTime=10;s.guardianCharges=1;s.utilityCooldown=25;}
 else return false;
 return id;
}
export function tickBloodContract(s,room,dt,effects){
 if(!(s.bloodTime>0)||s.player.hp<=0)return;
 for(const e of room.enemies)if(e.type==='boss'&&!e.summoned){const old=s.bloodBossHealth?.[e.id];if(old)s.bloodCredits=(s.bloodCredits||0)+Math.max(0,old.hp-Math.max(0,e.hp))/Math.max(1,old.max)*10;(s.bloodBossHealth??={})[e.id]={hp:Math.max(0,e.hp),max:e.max};}
 for(const e of room.enemies)if(e.hp<=0&&e.type!=='boss'&&!e.summoned&&!e.selfDestruct&&!e.bloodCounted){e.bloodCounted=true;s.bloodKills=(s.bloodKills||0)+1;if(s.bloodKills>=5){s.bloodKills-=5;s.bloodCredits=(s.bloodCredits||0)+1;}}
 while(s.bloodCredits>=1&&(s.bloodHeals||0)<2){s.bloodCredits--;s.bloodHeals=(s.bloodHeals||0)+1;s.player.hp=Math.min(s.player.max,s.player.hp+1);effects.push({x:s.player.x,y:s.player.y-38,t:.6,text:'흡혈 +1 ♥',color:'#e98cba'});}
 s.bloodTime=Math.max(0,s.bloodTime-dt);
}
export function absorbGuardian(s){if(!(s.guardianTime>0&&s.guardianCharges>0))return false;s.guardianCharges=0;s.guardianTime=0;return true;}
