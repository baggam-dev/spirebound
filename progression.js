import {lightningImpact} from './lightning.js';
import {growthRewards,growthAvailable,applyGrowth} from './growth.js';
import {FROST_DAMAGE_FACTOR} from './combat-tuning.js';
import {applyFrost} from './frost.js';
import {bindDefenses,enemyDamageFactor} from './enemy-defense.js';
import {runRandom} from './random.js';
import {mainSkills,allowedSkill,skillGrade} from './skill-tree.js';
import {elementalImpact,markFireKill,fireFieldSpec} from './elements.js';
import {directRelicFactor,relicStat,ownedRelics,hexFactor} from './relics.js';
import {migrateEnemies} from './balance.js';
import {migrateHealth} from './health.js';
export const MOVE_SPEED = 174;
export function xpRequired(level){return Math.ceil(level*30*1.35);}
export const skills = [
 {id:'split',name:'갈래 화살',description:'희귀 · 추가 화살 +1 · 추가탄 피해 45%와 주력 속성 · 최대 5발',max:4},
 {id:'pierce',name:'관통 화살',description:'관통하는 적 +1',max:3},
 {id:'haste',name:'사냥꾼의 리듬',description:'공격 속도 +10%',max:5},
 {id:'fire',name:'화염 화살',description:'발사 빈도 30% 감소 · 강력한 한 발 · 화살 첫 적중 폭발 · 즉시 폭발 · 레벨당 범위/피해 증가 · 2레벨 중첩 화상 · 3레벨: 화상 3중첩 적을 화염으로 처치하면 장판',max:3},
 {id:'poison',name:'독 화살',description:'관통한 모든 적에게 3초 독 (최대 8중첩) · 2중첩 독가스 · 레벨당 피해/가스 범위 증가 · 3레벨 독 처치 시 폭발',max:3},
 {id:'frost',name:'서리 화살',description:'중첩 둔화 · 빙결 4/3/2/2타 · 서리 피해 10/15/20/25% · 중첩 사망 6파편 · 4레벨 빙결 사망 12파편',max:4},
 {id:'chain',name:'번개 화살',description:'직격 번개 15/25/35% · 전이 45/55/65%, 이후 80% 유지 · 3초마다 1/2/3체에 일반 화살 1발분 천둥',max:3},
 {id:'power',name:'화살 연마',description:'화살 직격 및 속성 피해 +12%',max:5},
 {id:'repeat',name:'연속 화살',description:'희귀 · 0.16초 후 같은 방향 추가 1발 · 피해/지속 피해 60% · 주력 속성 발동',max:1},
 {id:'ultimate',name:'궁극기 습득',description:'화살비 또는 자동 저격 석궁 중 하나를 선택합니다.',max:1},
 {id:'aura',name:'근접 오라',description:'반경 90/115/140 · 초당 피해 24/48/72 · 3레벨 60초마다 1회 방어',max:3},
 {id:'homing',name:'추적 화살',description:'유니크 · 공격당 기술 레벨 수만큼만 유도 · 중앙 화살 우선',max:1},
].map(k=>({...k,tree:mainSkills.includes(k.id)?'main':'support',grade:skillGrade(k.id),weight:k.id==='homing'?.04:['split','repeat'].includes(k.id)?.18:1}));
export const recipes = [
 {name:'폭풍 화살',needs:['split','pierce'],description:'모든 화살 피해 +3'},
 {name:'속성 연사',needs:['fire','repeat'],description:'뒤따르는 화살도 작은 화염 폭발 발동'},
 {name:'뇌우',needs:['chain','haste'],description:'번개 전이 거리 +40 · 레벨별 전이 45/55/65%, 이후 80% 유지'},
];
export function combinations(p){return recipes.filter(r=>r.needs.every(id=>p[id]>0));}
export function migrateRun(s){if(!s.upgrade21){s.player.ultimate=s.player.evolutions?.ultimate?1:0;if(s.player.evolutions?.ultimate==='field')s.player.evolutions.ultimate='turret';s.upgrade21=true;}s.player.relics=ownedRelics(s.player);delete s.player.relic;if(!s.combatVersion){for(const r of s.floors.flat())r.fireZones=[];s.combatVersion=17;}migrateHealth(s);migrateEnemies(s);s.player.speed=MOVE_SPEED;if(!s.skillSystemVersion){s.player.poison=s.player.fire||0;s.player.fire=0;if(s.player.evolutions?.fire){s.player.evolutions.poison=s.player.evolutions.fire;delete s.player.evolutions.fire;}if(s.choices)s.choices=s.choices.map(id=>id==='fire'?'poison':id);s.skillSystemVersion=13;}for(const skill of skills)s.player[skill.id]??=0;if(s.skillSystemVersion<14){s.skillSystemVersion=14;s.choices=null;}return s;}
export function skillChoices(p,random=Math.random){const pool=skills.filter(k=>k.id!=='ultimate'&&allowedSkill(p,k.id)&&(p[k.id]||0)<k.max),chosen=[];while(pool.length&&chosen.length<3){let roll=random()*pool.reduce((n,k)=>n+k.weight,0),i=0;while(i<pool.length-1&&roll>=pool[i].weight)roll-=pool[i++].weight;chosen.push(pool.splice(i,1)[0]);}return chosen;}
export function applySkill(p,id){const skill=skills.find(k=>k.id===id);if(!skill||!allowedSkill(p,id)||(p[id]||0)>=skill.max)return false;if(mainSkills.includes(id))p.mainSkill??=id;p[id]=(p[id]||0)+1;return true;}
// Both minimap cells and its bounds must derive only from explored rooms.
export function discoveredRooms(rooms){return rooms.filter(r=>r.seen);}
export function hitEnemy(p,e,enemies,obstacles=[],scale=1,elemental=true,room=null,origin=p){
 p={...p,damage:p.damage*scale*hexFactor(p,'damage')*(1+.12*(p.power||0)+relicStat(p,'damage')),effectScale:scale*hexFactor(p,'damage')*(1+.12*(p.power||0)+relicStat(p,'damage'))*(1+relicStat(p,'element'))};
 bindDefenses(enemies);if(p.frost&&elemental)applyFrost(p,e);const wasFrozen=e.frozen>0,wasAlive=e.hp>0;const effects=[];e.hp-=(p.damage+(p.split&&p.pierce?3*scale:0))*(p.evolutions?.pierce==='depth'?.85:p.evolutions?.pierce==='impact'?1.25:1)*(p.evolutions?.haste==='tempo'?.85:1)*directRelicFactor(p,e)*(p.frost?FROST_DAMAGE_FACTOR:1)*(p.frostShardAttack?1+relicStat(p,'element'):1)*enemyDamageFactor(e,origin);
 if(wasAlive)markFireKill(e,fireFieldSpec(p));
 if(elemental)effects.push(...elementalImpact(p,e,enemies,room));
 else if(p.poison)effects.push(...elementalImpact({...p,fire:0},e,enemies,room));
 if(p.frost&&elemental&&!p.frostShardAttack)e.hp-=p.damage*FROST_DAMAGE_FACTOR*(.05+.05*p.frost)*(1+relicStat(p,'element'))*enemyDamageFactor(e,origin);
 if(p.chain&&elemental)effects.push(...lightningImpact(p,e,enemies));
 if(wasFrozen&&e.hp<=0)e.frozenDeath=true;return effects;
}
export function tickEffects(e,dt){if(e.hp<=0){if(e.frozen>0)e.frozenDeath=true;return;}const wasFrozen=e.frozen>0;if(e.burn>0)e.hp-=Math.min(dt,e.burn)*(e.burnDamage||0)*enemyDamageFactor(e);if(wasFrozen&&e.hp<=0)e.frozenDeath=true;for(const k of ['burn','slow','blastCooldown','frozen','freezeImmune','frostStackTime'])e[k]=Math.max(0,(e[k]||0)-dt);if(!e.frostStackTime)e.frostStacks=0;}

export function rerollSkills(s){
 if(s.status!=='playing'||!s.player.mainSkill||s.pendingLevels<=0||!s.choices?.length||(s.rerolls??1)<=0)return false;
 if(s.choices.every(id=>levelReward(id)?.growth))return false;
 s.choices=levelChoices(s,()=>runRandom(s),true).map(k=>k.id);s.rerolls=(s.rerolls??1)-1;return true;
}

export function levelChoices(s,random=()=>runRandom(s),reroll=false){
 const restoring=!reroll&&!!s.choices?.length;
 if(restoring){const saved=s.choices.map(levelReward).filter(k=>k&&(k.growth?growthAvailable(s.player,k):allowedSkill(s.player,k.id)&&(s.player[k.id]||0)<k.max));if(saved.length){s.choices=saved.map(k=>k.id);return saved;}}
 const level=s.levelQueue?.[0]??(s.upgrade21?0:s.player.level);
 // Restoring stale candidates must not roll or consume an ultimate milestone again.
 if(!reroll&&!restoring){s.ultimateOffer=false;if(!s.player.ultimate&&level>=5){s.ultimateMilestones??=[];const guaranteed=[5,10].includes(level)&&!s.ultimateMilestones.includes(level);s.ultimateOffer=guaranteed||random()<.3;if(guaranteed)s.ultimateMilestones.push(level);}}
 const choices=skillChoices(s.player,random);
 if(s.ultimateOffer&&!s.player.ultimate){if(choices.length===3)choices.pop();choices.push(skills.find(k=>k.id==='ultimate'));}
 if(!choices.length)choices.push(...growthRewards.filter(k=>growthAvailable(s.player,k)));
 s.choices=choices.map(k=>k.id);return choices;
}
export function consumeLevelChoice(s){s.pendingLevels--;s.levelQueue?.shift();s.choices=null;s.ultimateOffer=false;}

export function levelReward(id){return skills.find(k=>k.id===id)||growthRewards.find(k=>k.id===id);}
export function applyLevelReward(s,id){if(s.pendingLevels<=0||!s.choices?.includes(id))return false;return growthRewards.some(k=>k.id===id)?applyGrowth(s.player,id):applySkill(s.player,id);}
