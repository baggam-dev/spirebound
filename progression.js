export const MOVE_SPEED = 174;
export function xpRequired(level){return Math.ceil(level*30*1.35);}
export const skills = [
 {id:'split',name:'갈래 화살',description:'추가 화살 +1 · 최대 5발',max:4},
 {id:'pierce',name:'관통 화살',description:'관통하는 적 +1',max:3},
 {id:'haste',name:'사냥꾼의 리듬',description:'공격 속도 +20% · 최대 HP +15, 회복 25',max:5},
 {id:'fire',name:'불씨 화살',description:'적중 시 3초간 화상 · 초당 피해 5 증가',max:3},
 {id:'frost',name:'서리 화살',description:'적중 시 2초간 둔화 · 둔화율 15% 증가',max:3},
 {id:'chain',name:'연쇄 번개',description:'적중 시 주변 적에게 번개 · 전이 대상 +1',max:3},
];
export const recipes = [
 {name:'폭풍 화살',needs:['split','pierce'],description:'모든 화살 피해 +8'},
 {name:'해빙 폭발',needs:['fire','frost'],description:'둔화된 적 적중 시 주변에 폭발 (대상별 1초 간격)'},
 {name:'뇌우',needs:['chain','haste'],description:'번개 전이 거리 +70 · 피해 배율 45% → 65%'},
];
export function combinations(p){return recipes.filter(r=>r.needs.every(id=>p[id]>0));}
export function migrateRun(s){s.player.speed=MOVE_SPEED;for(const skill of skills)s.player[skill.id]??=0;return s;}
export function skillChoices(p,random=Math.random){const pool=skills.filter(k=>(p[k.id]||0)<k.max);for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}return pool.slice(0,3);}
export function applySkill(p,id){const skill=skills.find(k=>k.id===id);if(!skill||(p[id]||0)>=skill.max)return false;p[id]=(p[id]||0)+1;if(id==='haste'){p.max+=15;p.hp=Math.min(p.max,p.hp+25);}return true;}
// Both minimap cells and its bounds must derive only from explored rooms.
export function discoveredRooms(rooms){return rooms.filter(r=>r.seen);}
export function hitEnemy(p,e,enemies){
 const effects=[];e.hp-=p.damage+(p.split&&p.pierce?8:0);
 if(p.fire&&p.frost&&e.slow>0&&!(e.blastCooldown>0)){e.blastCooldown=1;for(const other of enemies)if(other.hp>0&&Math.hypot(other.x-e.x,other.y-e.y)<80)other.hp-=p.damage*.6;effects.push({x:e.x,y:e.y,r:80,t:.6,color:'#f2b985'});}
 if(p.fire){e.burn=3;e.burnDamage=5*p.fire;}
 if(p.frost){e.slow=2;e.slowFactor=1-.15*p.frost;}
 if(p.chain){let origin=e;const visited=new Set([e]);for(let i=0;i<p.chain;i++){const next=enemies.filter(n=>n.hp>0&&!visited.has(n)&&Math.hypot(n.x-origin.x,n.y-origin.y)<(p.haste?210:140)).sort((a,b)=>Math.hypot(a.x-origin.x,a.y-origin.y)-Math.hypot(b.x-origin.x,b.y-origin.y))[0];if(!next)break;next.hp-=p.damage*(p.haste?.65:.45);effects.push({x:origin.x,y:origin.y,toX:next.x,toY:next.y,t:.2,color:'#a5c9ff'});visited.add(next);origin=next;}}
 return effects;
}
export function tickEffects(e,dt){if(e.burn>0)e.hp-=Math.min(dt,e.burn)*(e.burnDamage||0);for(const k of ['burn','slow','blastCooldown'])e[k]=Math.max(0,(e[k]||0)-dt);}
