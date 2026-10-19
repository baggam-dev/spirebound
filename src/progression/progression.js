import {migrateSkillOverhaul,fairyTrio} from './skill-overhaul.js';
import {lightningImpact,chargePrimary} from '../combat/lightning.js';
import {growthRewards,growthAvailable,applyGrowth} from './growth.js';
import {FROST_DAMAGE_FACTOR} from '../combat/combat-tuning.js';
import {applyFrost,finishFrost} from '../combat/frost.js';
import {bindDefenses,enemyDamageFactor,absorbDemonShield} from '../combat/enemy-defense.js';
import {runRandom} from '../game/random.js';
import {mainSkills,allowedSkill,skillGrade} from './skill-tree.js';
import {elementalImpact,markFireKill,fireFieldSpec} from '../combat/elements.js';
import {directRelicFactor,relicStat,ownedRelics,hexFactor} from './relics.js';
import {migrateEnemies} from '../combat/balance.js';
import {migrateHealth} from '../combat/health.js';
import {precisionMultiplier,recordPrecisionHit,tickPrecision} from '../combat/precision.js';
import {synergySkills,exclusiveMain} from './synergies.js';
export const MOVE_SPEED = 174;
export function xpRequired(level){return Math.ceil(level*40.5*(level>=10?.75:level>=5?.85:1));}
export const skills = [
 {id:'split',name:'갈래 화살',description:'희귀 · 추가 화살 +1 · 추가탄 피해 45%와 주력 속성 · 최대 5발',max:4},
 {id:'pierce',name:'관통 화살',description:'관통하는 적 +1 · 최대 2레벨',max:2},
 {id:'haste',name:'속사 숙련',description:'공격 속도 +10%',max:5},
 {id:'fire',name:'화염 화살',description:'발사 빈도 38% 감소 · 강력한 한 발 · 화살 첫 적중 폭발 · 즉시 폭발 · 레벨당 범위/피해 증가 · 2레벨 중첩 화상 · 3레벨: 화상 3중첩 적을 화염으로 처치하면 장판',max:3},
 {id:'poison',name:'독 화살',description:'관통한 모든 적에게 3초 독 (최대 8중첩) · 2중첩 독가스 · 레벨당 피해/가스 범위 증가 · 3레벨 독 처치 시 폭발',max:3},
 {id:'frost',name:'서리 화살',description:'중첩 둔화 · 빙결 4/3/2/2타 · 서리 피해 10/15/20% · 중첩 사망 6파편 · 3레벨 빙결 사망 12파편',max:3},
 {id:'chain',name:'번개 화살',description:'직격 번개 15/25/35% · 전이 45/55/65%, 이후 80% 유지 · 3초마다 1/2/3체에 일반 화살 1발분 천둥',max:3},
 {id:'precision',name:'정밀 사격',description:'무속성 직격 강화 · 같은 적 3회 적중마다 강화탄 · 2레벨 강화 · 3레벨 저격/결정 사격 분기',max:3},
 {id:'weakpoint',name:'약점 추적',description:'정밀 사격 전용 · 같은 적 연속 적중 직격 피해 +10/20/30%',max:3},
 {id:'finisher',name:'마무리 조준',description:'정밀 사격 전용 · 체력 35% 이하 대상 직격 피해 +15/30/45%',max:3},
 {id:'power',name:'궁술 연마',description:'주화살 직격 피해 +12% · 속성 자체 배율 제외',max:5},
 {id:'repeat',name:'연속 화살',description:'유니크 · 0.16초 후 같은 방향 추가 1발 · 피해/지속 피해 60% · 주력 속성 발동',max:1},
 {id:'ultimate',name:'궁극기 습득',description:'화살비 또는 자동 저격 석궁 중 하나를 선택합니다.',max:1},
 {id:'aura',name:'망령검: 베르가스',description:'유니크 보조 · 접근한 적을 자동 요격 · 평타 200/400/600% · 범위 180 · 재사용 3.2/3.0/2.8초 · 3레벨 단죄/검무 분기',max:3},
 {id:'homing',name:'추적 화살',description:'유니크 · 1.5초마다 별도 무속성 유도 화살 1발 · 일반 공격력 100% · 갈래/연속 복제 없음',max:1},
 {id:'rollMastery',name:'회피의 극의',description:'유니크 · 잔영 지뢰 / 질풍 회피 / 일섬 중 하나로 구르기를 진화',max:1},
 {id:'sunFairy',name:'태양요정: 솔리아',description:'유니크 · 1.5초마다 80% 탄 +3초 총60% 화상 · 물약 회복 +1하트',max:1},
 {id:'snowFairy',name:'눈꽃요정: 니베아',description:'유니크 · 1.5초마다 70% 탄 / 2초 25%둔화 · 이속 +5%',max:1},
 {id:'stormFairy',name:'번개요정: 볼티아',description:'유니크 · 1.5초마다 100% 탄 +주변1체 50% 전이 · 공속 +5%',max:1},
 {id:'fairyKing',name:'요정왕: 아스테리온',description:'3요정 완성 · 공속 +15% / 이속 +10% / 직격 +15% · 3초마다 600% 관통 레이저',max:1},
 ...synergySkills].map(k=>({...k,tree:mainSkills.includes(k.id)?'main':'support',grade:skillGrade(k.id),weight:['aura','homing'].includes(k.id)?.04:['sunFairy','snowFairy','stormFairy'].includes(k.id)?.35:skillGrade(k.id)==='unique'?.12:k.id==='split'?.18:1}));
export const recipes = [
 {name:'폭풍 화살',needs:['split','pierce'],description:'모든 화살 피해 +3 · 첫 관통 후 전방 240 내 적에게 한 번 꺾임'},
 {name:'속성 연사',needs:['fire','repeat'],description:'뒤따르는 화살도 작은 화염 폭발 발동'},
 {name:'뇌우',needs:['chain','haste'],description:'번개 전이 거리 +40 · 레벨별 전이 45/55/65%, 이후 80% 유지'},
];
export function combinations(p){return recipes.filter(r=>r.needs.every(id=>p[id]>0));}
export function migrateRun(s){if(!s.upgrade21){s.player.ultimate=s.player.evolutions?.ultimate?1:0;if(s.player.evolutions?.ultimate==='field')s.player.evolutions.ultimate='turret';s.upgrade21=true;}s.player.relics=ownedRelics(s.player);delete s.player.relic;if(!s.combatVersion){for(const r of s.floors.flat())r.fireZones=[];s.combatVersion=17;}migrateHealth(s);migrateEnemies(s);s.player.speed=MOVE_SPEED;if(!s.skillSystemVersion){s.player.poison=s.player.fire||0;s.player.fire=0;if(s.player.evolutions?.fire){s.player.evolutions.poison=s.player.evolutions.fire;delete s.player.evolutions.fire;}if(s.choices)s.choices=s.choices.map(id=>id==='fire'?'poison':id);s.skillSystemVersion=13;}for(const skill of skills)s.player[skill.id]??=0;if(s.skillSystemVersion<14){s.skillSystemVersion=14;s.choices=null;}if(!s.spectralBladeVersion){s.player.legacyAuraGuard=(s.player.aura||0)>=3;s.spectralBladeVersion=1;delete s.auraVisual;}s.skillDraftVersion??=1;return migrateSkillOverhaul(s);}
// Unique rarity applies to acquisition; an owned blade upgrades at normal support weight.
export const skillOfferWeight=(p,skill)=>skill.id==='aura'&&p.aura>0?1:skill.weight;
export function skillChoices(p,random=Math.random){const pool=skills.filter(k=>k.id!=='ultimate'&&allowedSkill(p,k.id)&&(p[k.id]||0)<k.max).map(k=>({...k,weight:skillOfferWeight(p,k)})),chosen=[];while(pool.length&&chosen.length<3){let roll=random()*pool.reduce((n,k)=>n+k.weight,0),i=0;while(i<pool.length-1&&roll>=pool[i].weight)roll-=pool[i++].weight;chosen.push(pool.splice(i,1)[0]);}return chosen;}
export function applySkill(p,id){const skill=skills.find(k=>k.id===id);if(!skill||id==='ultimate'||!allowedSkill(p,id)||(p[id]||0)>=skill.max)return false;if(mainSkills.includes(id))p.mainSkill??=id;p[id]=(p[id]||0)+1;return true;}
// Both minimap cells and its bounds must derive only from explored rooms.
export function discoveredRooms(rooms){return rooms.filter(r=>r.seen);}
export function hitEnemy(p,e,enemies,obstacles=[],scale=1,elemental=true,room=null,origin=p,shot={}){
 const sourcePlayer=p,beforeDirect=e.hp,elementBase=p.damage*scale*hexFactor(p,'damage')*(1+relicStat(p,'damage'));
 if(absorbDemonShield(e))return [{x:e.x,y:e.y-45,t:.5,color:'#9edcf8',text:'방어막!'}];
 p={...p,damage:p.damage*scale*hexFactor(p,'damage')*(1+.12*(p.power||0)+relicStat(p,'damage')),effectScale:scale*hexFactor(p,'damage')*(1+relicStat(p,'damage'))*(1+relicStat(p,'element'))};
 bindDefenses(enemies);if(p.frost&&elemental)applyFrost(p,e);const wasFrozen=e.frozen>0,wasAlive=e.hp>0;const effects=[];const precision=shot.primary&&p.precision?precisionMultiplier(p,e):1;e.hp-=(p.damage+(p.split&&p.pierce?3*scale:0))*(p.evolutions?.pierce==='depth'?.85:p.evolutions?.pierce==='impact'?1.25:1)*(p.evolutions?.haste==='tempo'?.85:1)*directRelicFactor(p,e,!p.frostShardAttack)*(p.frost?FROST_DAMAGE_FACTOR:1)*(p.frostShardAttack?1+relicStat(p,'element'):1)*enemyDamageFactor(e,origin)*precision*(p.fairyKing?1.15:1);
 if(shot.primary&&p.precision){const burst=(e.precisionHits||0)>=(p.evolutions?.precision==='sniper'?1:2);recordPrecisionHit(p,e);if(burst)effects.push({x:e.x,y:e.y-28,t:.65,color:'#f9e2a5',text:'약점!'});}
 shot={...shot,validDirect:e.hp<beforeDirect,venomPrimary:shot.venomPrimary??shot.primary};
 if(p.chain&&elemental&&shot.validDirect)p.chargeBonus=chargePrimary(sourcePlayer,shot);
 if(p.chargeBonus)effects.push({x:e.x,y:e.y-28,t:.5,color:'#dcc4ff',text:'축전 방전'},{x:e.x,y:e.y,t:.28,duration:.28,synergyEffect:'charge'});
 if(wasAlive)markFireKill(e,fireFieldSpec(p));
 if(elemental)effects.push(...elementalImpact({...p,damage:elementBase},e,enemies,room,shot));
 else if(p.poison)effects.push(...elementalImpact({...p,fire:0},e,enemies,room,shot));
 if(p.frost&&elemental&&!p.frostShardAttack)e.hp-=elementBase*FROST_DAMAGE_FACTOR*(.05+.05*p.frost)*(1+relicStat(p,'element'))*enemyDamageFactor(e,origin);
 if(p.chain&&elemental)effects.push(...lightningImpact({...p,damage:elementBase},e,enemies));
 if(wasFrozen&&e.hp<=0)e.frozenDeath=true;return effects;
}
export function tickEffects(e,dt){if(e.hp<=0){if(e.frozen>0)e.frozenDeath=true;return;}tickPrecision(e,dt);const wasFrozen=e.frozen>0;if(e.burn>0&&e.burnDamage>0)e.hp-=Math.min(dt,e.burn)*(e.burnDamage||0)*enemyDamageFactor(e);if(wasFrozen&&e.hp<=0)e.frozenDeath=true;for(const k of ['burn','slow','blastCooldown','frozen','freezeImmune','frostStackTime'])e[k]=Math.max(0,(e[k]||0)-dt);if(!e.frostStackTime)e.frostStacks=0;finishFrost(e,wasFrozen);}

export function rerollSkills(s){
 if(s.status!=='playing'||!s.player.mainSkill||s.pendingLevels<=0||!s.choices?.length||(s.rerolls??1)<=0)return false;
 if(s.choices.every(id=>levelReward(id)?.growth))return false;
 s.choices=levelChoices(s,()=>runRandom(s),true).map(k=>k.id);s.rerolls=(s.rerolls??1)-1;return true;
}

export function levelChoices(s,random=()=>runRandom(s),reroll=false){
 const restoring=!reroll&&!!s.choices?.length;
 if(restoring){const saved=s.choices.map(levelReward).filter(k=>k&&(k.growth?growthAvailable(s.player,k):allowedSkill(s.player,k.id)&&(s.player[k.id]||0)<k.max));if(saved.length){if(fairyTrio(s.player)&&!s.player.fairyKing&&!saved.some(k=>k.id==='fairyKing')){if(saved.length===3)saved.pop();saved.push(skills.find(k=>k.id==='fairyKing'));}s.choices=saved.map(k=>k.id);return saved;}}
 const level=s.levelQueue?.[0]??(s.upgrade21?0:s.player.level);
 // Restoring stale candidates must not roll or consume an ultimate milestone again.
 s.ultimateOffer=false;
 const choices=skillChoices(s.player,random);
 if(s.player.mainSkill==='precision'&&level<=3&&!s.player.weakpoint&&!s.player.finisher&&!choices.some(k=>['weakpoint','finisher'].includes(k.id))){const slot=choices.findIndex(k=>k.id!=='ultimate');if(slot>=0)choices[slot]=skills.find(k=>k.id==='weakpoint');}
 const linked=k=>k.id===s.player.mainSkill||exclusiveMain(k.id)===s.player.mainSkill;
 if(!choices.some(linked)){const pool=skills.filter(k=>linked(k)&&allowedSkill(s.player,k.id)&&(s.player[k.id]||0)<k.max);if(pool.length)choices[0]=pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];}
 const linkedIndex=choices.findIndex(linked);if(linkedIndex>0){const [reserved]=choices.splice(linkedIndex,1);choices.unshift(reserved);}
 if(fairyTrio(s.player)&&!s.player.fairyKing&&!choices.some(k=>k.id==='fairyKing')){if(choices.length===3)choices.pop();choices.push(skills.find(k=>k.id==='fairyKing'));}
 if(!choices.length)choices.push(...growthRewards.filter(k=>growthAvailable(s.player,k)));
 s.choices=choices.map(k=>k.id);return choices;
}
export function consumeLevelChoice(s){s.pendingLevels--;s.levelQueue?.shift();s.choices=null;s.ultimateOffer=false;}

export function levelReward(id){return skills.find(k=>k.id===id)||growthRewards.find(k=>k.id===id);}
export function applyLevelReward(s,id){if(s.pendingLevels<=0||!s.choices?.includes(id))return false;return growthRewards.some(k=>k.id===id)?applyGrowth(s.player,id):applySkill(s.player,id);}
