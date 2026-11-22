import {wardenArriving} from './warden-arrival.js';
import {utilityAvailable} from '../progression/skill-overhaul.js';
import {utilityCooldown} from '../progression/relics.js';
import {expandedUtilities,canStartExpandedUtility,startExpandedUtility} from './utility-expansion.js';
export const utilitySkills=[
 {id:'focus',name:'마혈 각성',description:'1하트 소모 · 7초 공속 +70% / 이속 +25% · 재사용 25초'},
 {id:'firstAid',name:'혈월의 계약',description:'8초간 5처치 또는 보스 최대체력 10% 피해마다 1하트 회복 · 회당 최대 2하트 · 재사용 30초'},
 {id:'guardian',name:'성역의 구체',description:'10초 동안 구체 쉴드가 피격 1회 방어 · 재사용 25초'},
 ...expandedUtilities
];
export function chooseUtility(s,id,{reward=false}={}){if(s.status!=='playing'||s.player.actionStun>0&&!reward||!utilityAvailable(s)||s.player.utility||!utilitySkills.some(k=>k.id===id))return false;s.player.utility=id;s.utilityCooldown=0;return true;}
export function utilityUseState(s){
 const blocked=(code,short,reason)=>({ready:false,code,short,reason});
 if(!s?.player||!utilitySkills.some(k=>k.id===s.player.utility))return blocked('unowned','미보유','액티브 기술을 아직 획득하지 않았습니다.');
 if(s.status!=='playing'||!(s.player.hp>0))return blocked('inactive','사용 불가','탐험 중 살아 있을 때 사용할 수 있습니다.');
 if(wardenArriving(s))return blocked('arrival','등장 중','보스 등장 연출이 끝난 뒤 사용할 수 있습니다.');
 if(s.player.actionStun>0)return blocked('stunned','경직 중','경직이 끝난 뒤 사용할 수 있습니다.');
 if(s.utilityCast)return blocked('casting','발동 대기','이미 사용한 기술이 발동 대기 중입니다.');
 if(s.utilityCooldown>0){const remaining=(Math.ceil(s.utilityCooldown*10)/10).toFixed(1);return blocked('cooldown',remaining+'초','재사용까지 '+remaining+'초 남았습니다.');}
 if(s.player.utility==='focus'&&!(s.player.hp>1))return blocked('health','체력 부족','마혈 각성은 소모할 체력 1하트가 필요합니다. 현재 체력이 1하트보다 많아야 합니다.');
 if(!canStartExpandedUtility(s,s.player.utility))return blocked('target','대상 없음','뇌격인장은 500 범위 안에 벽에 가리지 않은 지상 적이 필요합니다.');
 return {ready:true,code:'ready',short:'준비',reason:'지금 사용할 수 있습니다.'};
}
export const canCastUtility=s=>utilityUseState(s).ready;
export function castUtility(s){
 const id=s.player.utility;if(!canCastUtility(s))return false;
 if(id==='firstAid'){
  s.bloodTime=8;s.bloodKills=0;s.bloodCredits=0;s.bloodHeals=0;s.bloodBossHealth={};for(const e of s.floors[s.floor][s.room].enemies)if(e.type==='boss')s.bloodBossHealth[e.id]={hp:Math.max(0,e.hp),max:e.max};s.utilityCooldown=30;
 }else if(id==='focus'){s.player.hp--;s.player.focusTime=7;s.utilityCooldown=25;}
 else if(id==='guardian'){s.guardianTime=10;s.guardianCharges=1;s.utilityCooldown=25;}
 else if(!startExpandedUtility(s,id))return false;
 s.utilityCooldown=utilityCooldown(s.player,id);
 return id;
}
export function tickBloodContract(s,room,dt,effects){
 if(!(s.bloodTime>0)||s.player.hp<=0)return;
 let healOrigin=null;
 for(const e of room.enemies)if(e.type==='boss'&&!e.summoned){const old=s.bloodBossHealth?.[e.id];if(old&&old.hp>Math.max(0,e.hp))healOrigin={x:e.x,y:e.y};if(old)s.bloodCredits=(s.bloodCredits||0)+Math.max(0,old.hp-Math.max(0,e.hp))/Math.max(1,old.max)*10;(s.bloodBossHealth??={})[e.id]={hp:Math.max(0,e.hp),max:e.max};}
 for(const e of room.enemies)if(e.hp<=0&&e.type!=='boss'&&!e.summoned&&!e.selfDestruct&&!e.bloodCounted){e.bloodCounted=true;s.bloodKills=(s.bloodKills||0)+1;if(s.bloodKills>=5){s.bloodKills-=5;s.bloodCredits=(s.bloodCredits||0)+1;healOrigin={x:e.x,y:e.y};}}
 while(s.bloodCredits>=1&&(s.bloodHeals||0)<2){
  s.bloodCredits--;s.bloodHeals=(s.bloodHeals||0)+1;const hp=s.player.hp;s.player.hp=Math.min(s.player.max,hp+1);
  effects.push({x:s.player.x,y:s.player.y-38,t:.6,text:s.player.hp>hp?'흡혈 +1 ♥':'계약 충족 · 체력 가득',color:'#e0a2bf'});
  if(s.player.hp>hp)effects.push({utilityFx:'bloodHeal',x:s.player.x,y:s.player.y-18,fromX:healOrigin?.x??s.player.x-22,fromY:healOrigin?.y??s.player.y+12,t:.55,duration:.55});
 }
 s.bloodTime=Math.max(0,s.bloodTime-dt);
}
export function absorbGuardian(s){if(!(s.guardianTime>0&&s.guardianCharges>0))return false;s.guardianCharges=0;s.guardianTime=0;return true;}
