export const utilitySkills=[
 {id:'focus',name:'전투 집중',description:'5초간 기본 화살 직격 피해 +20%, 발사 간격 10% 감소 · 재사용 25초'},
 {id:'firstAid',name:'응급 처치',description:'주변 적과 거리를 벌린 뒤 1하트 회복 · 층당 1회 · 재사용 20초'},
 {id:'guardian',name:'수호 환영',description:'5초 동안 다음 피격 1회를 막는 환영 · 적 이동과 공격은 방해하지 않음 · 재사용 25초'}
];
export function chooseUtility(s,id){if(s.status!=='playing'||s.player.actionStun>0||s.player.level<4||s.player.utility||!utilitySkills.some(k=>k.id===id))return false;s.player.utility=id;s.utilityCooldown=0;s.utilityHealedFloors??=[];return true;}
export function castUtility(s){
 const id=s.player.utility;if(s.status!=='playing'||s.player.actionStun>0||!id||s.utilityCooldown>0)return false;
 const room=s.floors[s.floor][s.room];
 if(id==='firstAid'){
  if(s.player.hp>=s.player.max||s.utilityHealedFloors?.includes(s.floor)||room.enemies.some(e=>e.hp>0&&Math.hypot(e.x-s.player.x,e.y-s.player.y)<140))return false;
  s.player.hp=Math.min(s.player.max,s.player.hp+1);(s.utilityHealedFloors??=[]).push(s.floor);s.utilityCooldown=20;
 }else if(id==='focus'){s.player.focusTime=5;s.utilityCooldown=25;}
 else if(id==='guardian'){s.guardianTime=5;s.guardianCharges=1;s.utilityCooldown=25;}
 else return false;
 return id;
}
export function absorbGuardian(s){if(!(s.guardianTime>0&&s.guardianCharges>0))return false;s.guardianCharges=0;s.guardianTime=0;return true;}
