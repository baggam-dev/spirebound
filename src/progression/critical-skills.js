// Shared definitions; no imports from combat or progression to keep snapshots pure.
export const criticalSkills=[
 {id:'keenEye',name:'예리한 감각',grade:'normal',max:3,weight:.65,description:'치명타 확률 +4%p씩 · 최대 +12%p',steps:['확률 +4%p','확률 +8%p','확률 +12%p']},
 {id:'criticalTraining',name:'치명 숙련',grade:'normal',max:3,weight:.65,description:'치명타 피해 배율 +15%p씩 · 최대 +45%p',steps:['피해 배율 +15%p','피해 배율 +30%p','피해 배율 +45%p']},
 {id:'fractureMark',name:'균열 표식',grade:'rare',max:3,weight:.18,description:'치명타 후 2초간 대상 받는 피해 +5/8/10% · 비중첩 · 같은 명중에는 적용 안 됨',steps:['2초간 받는 피해 +5%','2초간 받는 피해 +8%','2초간 받는 피해 +10%']},
 {id:'evasiveFocus',name:'회피의 집중',grade:'rare',max:2,weight:.18,description:'구르기 성공 시 3초간 치명타 확률 +10/15%p · 재사용 8초',steps:['회피 후 3초 확률 +10%p / 8초','회피 후 3초 확률 +15%p / 8초']},
 {id:'decisiveMoment',name:'결정의 순간',grade:'unique',max:1,weight:.08,description:'치명타 확률 -5%p 대신 치명타 피해 배율 +45%p · 확률/배율 상한 유지',steps:['확률 -5%p · 피해 배율 +45%p']},
 {id:'royalJudgment',name:'왕의 선고',grade:'unique',max:1,weight:.08,description:'새 치명타 8회 충전 후 다음 궁극기 피해 +25% · 충전 간격 0.35초 · 지속 틱/파생/강화 궁극기는 충전 제외',steps:['치명타 8회 → 다음 궁극기 피해 +25%']}
];
export const criticalSkillIds=criticalSkills.map(k=>k.id);
export const criticalSkillInfo=id=>criticalSkills.find(k=>k.id===id);
export function criticalSkillAllowed(p,id){
 if(!criticalSkillIds.includes(id))return true;
 if(id==='keenEye'||id==='criticalTraining')return (p.level??1)>=3;
 if(id==='fractureMark'||id==='evasiveFocus')return (p.level??1)>=5&&!!(p.keenEye||p.criticalTraining);
 if(id==='decisiveMoment')return (p.level??1)>=8&&((p.keenEye||0)>=2||(p.criticalTraining||0)>=2);
 return (p.level??1)>=8&&p.ultimate===1&&!!(p.keenEye||p.criticalTraining);
}
export function criticalSkillBonuses(p){
 return {chance:.04*(p.keenEye||0)-(p.decisiveMoment?.05:0)+(p.critFocusTime>0?(p.evasiveFocus>=2?.15:.1):0),multiplier:.15*(p.criticalTraining||0)+(p.decisiveMoment?.45:0)};
}
export function activateEvasiveFocus(s){
 const p=s.player;if(!p.evasiveFocus||p.critFocusCooldown>0)return false;
 p.critFocusTime=3;p.critFocusCooldown=8;return true;
}
export function tickCriticalSkills(s,room,dt){
 for(const e of room.enemies){if(e.critMarkTime===undefined)continue;e.critMarkTime=Math.max(0,e.critMarkTime-dt);if(!e.critMarkTime){delete e.critMarkPower;delete e.critMarkAttack;}}
}
export function criticalSkillHit(s,e,result,player){
 if(!result.procEligible||!result.critical)return;
 const p=s.player;
 if(p.fractureMark&&e.hp>0){e.critMarkTime=2;e.critMarkPower=[.05,.08,.1][Math.min(3,p.fractureMark)-1];e.critMarkAttack=result.attackId;}
 if(p.royalJudgment&&!player?.judgmentEmpowered&&s.elapsed>=(s.critical.royalNextAt??0)){
  s.critical.royalCharges=Math.min(8,(s.critical.royalCharges||0)+1);s.critical.royalNextAt=s.elapsed+.35;
 }
}
export function consumeRoyalJudgment(s){
 if(!s.player.royalJudgment||(s.critical?.royalCharges||0)<8)return false;
 s.critical.royalCharges=0;return true;
}
