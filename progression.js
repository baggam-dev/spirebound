import {runRandom} from './random.js';
import {mainSkills,allowedSkill,skillGrade} from './skill-tree.js';
import {elementalImpact,markFireKill,fireFieldSpec} from './elements.js';
import {directRelicFactor} from './relics.js';
import {migrateEnemies} from './balance.js';
import {migrateHealth} from './health.js';
export const MOVE_SPEED = 174;
export function xpRequired(level){return Math.ceil(level*30*1.35);}
export const skills = [
 {id:'split',name:'갈래 화살',description:'희귀 · 추가 화살 +1 · 추가탄 피해 45%와 주력 속성 · 최대 5발',max:4},
 {id:'pierce',name:'관통 화살',description:'관통하는 적 +1',max:3},
 {id:'haste',name:'사냥꾼의 리듬',description:'공격 속도 +10%',max:5},
 {id:'fire',name:'화염 화살',description:'화살 첫 적중 폭발 · 레벨당 범위/피해 증가 · 2레벨 중첩 화상 · 3레벨: 화상 3중첩 적을 화염으로 처치하면 장판',max:3},
 {id:'poison',name:'독 화살',description:'화살 첫 적중 3초 독 (최대 8중첩) · 2중첩 독가스 · 레벨당 피해/가스 범위 증가 · 3레벨 독 처치 시 폭발',max:3},
 {id:'frost',name:'서리 화살',description:'화살 첫 적중 둔화 · 3중첩 빙결 1.2초 (보스 0.45초) · 빙결 처치 시 6방향 파편 (피해 1/3) · 3레벨 파편도 중첩',max:3},
 {id:'chain',name:'번개 화살',description:'적중 시 주변 적에게 번개 · 전이 대상 +1',max:3},
 {id:'power',name:'화살 연마',description:'화살 직격 및 속성 피해 +6%',max:5},
 {id:'repeat',name:'연속 화살',description:'희귀 · 0.16초 후 같은 방향 추가 1발 · 피해/지속 피해 60% · 주력 속성 발동',max:1},
 {id:'aura',name:'근접 오라',description:'레벨별 반경 70/85/100 · 초당 피해 8/16/24 · 벽에 차단',max:3},
 {id:'homing',name:'추적 화살',description:'유니크 · 공격당 기술 레벨 수만큼만 유도 · 중앙 화살 우선',max:1},
].map(k=>({...k,tree:mainSkills.includes(k.id)?'main':'support',grade:skillGrade(k.id),weight:k.id==='homing'?.04:['split','repeat'].includes(k.id)?.18:1}));
export const recipes = [
 {name:'폭풍 화살',needs:['split','pierce'],description:'모든 화살 피해 +3'},
 {name:'속성 연사',needs:['fire','repeat'],description:'뒤따르는 화살도 작은 화염 폭발 발동'},
 {name:'뇌우',needs:['chain','haste'],description:'번개 전이 거리 +40 · 첫 전이 피해 30%, 이후 55%씩 감쇠'},
];
export function combinations(p){return recipes.filter(r=>r.needs.every(id=>p[id]>0));}
export function migrateRun(s){if(!s.combatVersion){for(const r of s.floors.flat())r.fireZones=[];s.combatVersion=17;}migrateHealth(s);migrateEnemies(s);s.player.speed=MOVE_SPEED;if(!s.skillSystemVersion){s.player.poison=s.player.fire||0;s.player.fire=0;if(s.player.evolutions?.fire){s.player.evolutions.poison=s.player.evolutions.fire;delete s.player.evolutions.fire;}if(s.choices)s.choices=s.choices.map(id=>id==='fire'?'poison':id);s.skillSystemVersion=13;}for(const skill of skills)s.player[skill.id]??=0;if(s.skillSystemVersion<14){s.skillSystemVersion=14;s.choices=null;}return s;}
export function skillChoices(p,random=Math.random){const pool=skills.filter(k=>allowedSkill(p,k.id)&&(p[k.id]||0)<k.max),chosen=[];while(pool.length&&chosen.length<3){let roll=random()*pool.reduce((n,k)=>n+k.weight,0),i=0;while(i<pool.length-1&&roll>=pool[i].weight)roll-=pool[i++].weight;chosen.push(pool.splice(i,1)[0]);}return chosen;}
export function applySkill(p,id){const skill=skills.find(k=>k.id===id);if(!skill||!allowedSkill(p,id)||(p[id]||0)>=skill.max)return false;if(mainSkills.includes(id))p.mainSkill??=id;p[id]=(p[id]||0)+1;return true;}
// Both minimap cells and its bounds must derive only from explored rooms.
export function discoveredRooms(rooms){return rooms.filter(r=>r.seen);}
export function hitEnemy(p,e,enemies,obstacles=[],scale=1,elemental=true,room=null){
 p={...p,damage:p.damage*scale*(1+.06*(p.power||0)),effectScale:scale*(1+.06*(p.power||0))};
 const wasFrozen=e.frozen>0,wasAlive=e.hp>0;const effects=[];e.hp-=(p.damage+(p.split&&p.pierce?3*scale:0))*(p.evolutions?.pierce==='depth'?.85:p.evolutions?.pierce==='impact'?1.25:1)*(p.evolutions?.haste==='tempo'?.85:1)*directRelicFactor(p,e)*(e.protected?.5:1);
 if(wasAlive)markFireKill(e,fireFieldSpec(p));
 if(elemental)effects.push(...elementalImpact(p,e,enemies,room));
 if(p.frost&&elemental&&e.hp>0){if(!(e.frozen>0)&&!(e.freezeImmune>0)){e.frostStacks=(e.frostStacks||0)+1;e.frostStackTime=3;if(e.frostStacks>=3){e.frostStacks=0;e.frozen=e.type==='boss'?.45:1.2;e.freezeImmune=e.frozen+2;}};e.slow=p.evolutions?.frost==='deep'?1:p.evolutions?.frost==='lasting'?4:2;e.slowFactor=Math.max(.2,1-.15*p.frost+(p.evolutions?.frost==='deep'?-.15:p.evolutions?.frost==='lasting'?.1:0));}
 if(p.chain&&elemental){let origin=e;const visited=new Set([e]);for(let i=0;i<(p.evolutions?.chain==='surge'?1:p.chain+(p.evolutions?.chain==='web'?2:0));i++){const next=enemies.filter(n=>n.hp>0&&!visited.has(n)&&Math.hypot(n.x-origin.x,n.y-origin.y)<(p.haste?180:140)).sort((a,b)=>Math.hypot(a.x-origin.x,a.y-origin.y)-Math.hypot(b.x-origin.x,b.y-origin.y))[0];if(!next)break;next.hp-=p.damage*(p.evolutions?.chain==='surge'?.65:p.evolutions?.chain==='web'?.2:.3)*Math.pow(p.evolutions?.chain==='web'?.45:.55,i)*(next.protected?.5:1);effects.push({x:origin.x,y:origin.y,toX:next.x,toY:next.y,t:.2,color:'#a5c9ff'});visited.add(next);origin=next;}}
 if(wasFrozen&&e.hp<=0)e.frozenDeath=true;return effects;
}
export function tickEffects(e,dt){if(e.hp<=0){if(e.frozen>0)e.frozenDeath=true;return;}const wasFrozen=e.frozen>0;if(e.burn>0)e.hp-=Math.min(dt,e.burn)*(e.burnDamage||0)*(e.protected?.5:1);if(wasFrozen&&e.hp<=0)e.frozenDeath=true;for(const k of ['burn','slow','blastCooldown','frozen','freezeImmune','frostStackTime'])e[k]=Math.max(0,(e[k]||0)-dt);if(!e.frostStackTime)e.frostStacks=0;}

export function rerollSkills(s){
 if(s.status!=='playing'||!s.player.mainSkill||s.pendingLevels<=0||!s.choices?.length||(s.rerolls??1)<=0)return false;
 s.choices=skillChoices(s.player,()=>runRandom(s)).map(k=>k.id);s.rerolls=(s.rerolls??1)-1;return true;
}
