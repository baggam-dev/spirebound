import {skillIds,mainSkills} from './skill-tree.js';
import {relicInfo} from './relics.js';
import {enemyGuide} from './expedition.js';
import {evolutions} from './evolutions.js';
import {migrateRun} from './progression.js';
import {lootInfo} from './loot.js';
import {skills} from './progression.js';
export const SAVE_KEY='spirebound.run.v1';
export const HISTORY_KEY='spirebound.history';
export const RELEASE='0.17.0-prebeta';
const roomTypes=new Set(['exit','down','up','normal','boss','fountain','treasure','shrine','event']);
const enemyTypes=new Set(['chaser','charger','archer','scatter','brute','laser','ricochet','boss','flower','minislime']);
function check(condition){if(!condition)throw new Error('저장 데이터 형식이 올바르지 않습니다.');}
function number(value,min,max){return typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max;}
function finiteTree(value,depth=0){check(depth<15);if(typeof value==='number')check(Number.isFinite(value));if(value&&typeof value==='object')for(const item of Object.values(value))finiteTree(item,depth+1);}
export function validateRun(s){
 const field=z=>z&&number(z.r,1,150)&&number(z.time,0,2)&&number(z.dps,0,100);
 const loot=item=>{check(item&&lootInfo(item.id));if(['main','support','unique'].includes(item.id)){const skill=skills.find(k=>k.id===item.skill);check(skill&&(item.id==='main'?skill.tree==='main':item.id==='unique'?skill.grade==='unique':skill.tree==='support'&&skill.grade!=='unique'));}else check(item.skill===undefined);if(item.id==='boss')check(['warden','prism','slime'].includes(item.boss));};
 if(s.combatVersion!==undefined)check(s.combatVersion===17);if(s.tutorialComplete!==undefined)check(typeof s.tutorialComplete==='boolean');
 check(s&&s.version===1&&s.status==='playing');check(s.healthVersion===undefined||s.healthVersion===1);if(s.generationVersion!==undefined)check([12,13,16,17].includes(s.generationVersion));if(s.skillSystemVersion!==undefined)check([13,14].includes(s.skillSystemVersion));if(s.volleySide!==undefined)check(s.volleySide===1||s.volleySide===-1);if(s.rerolls!==undefined)check(Number.isInteger(s.rerolls)&&s.rerolls>=0&&s.rerolls<=1);finiteTree(s);
 check(Array.isArray(s.floors)&&[2,4,6].includes(s.floors.length));check(Number.isInteger(s.floor)&&s.floor>=0&&s.floor<s.floors.length);
 for(const rooms of s.floors){
  check(Array.isArray(rooms)&&rooms.length>=7&&rooms.length<=11);const coords=new Set();
  for(const r of rooms){check(Number.isInteger(r.x)&&Number.isInteger(r.y)&&Math.abs(r.x)<12&&Math.abs(r.y)<12&&roomTypes.has(r.type));check(!coords.has(`${r.x},${r.y}`));coords.add(`${r.x},${r.y}`);check(typeof r.seen==='boolean'&&typeof r.used==='boolean');
   check(Array.isArray(r.enemies)&&r.enemies.length<=128);const ids=new Set();
   for(const e of r.enemies){check(enemyTypes.has(e.type)&&Number.isInteger(e.id)&&!ids.has(e.id));ids.add(e.id);check(number(e.x,-50,1010)&&number(e.y,-50,590)&&number(e.max,1,100000)&&number(e.hp,-100000,e.max));}
   if(r.relicOffers!==undefined)check(Array.isArray(r.relicOffers)&&r.relicOffers.length<=3&&new Set(r.relicOffers).size===r.relicOffers.length&&r.relicOffers.every(id=>relicInfo(id))&&typeof r.relicClaimed==='boolean');
   if(r.returnRisk!==undefined)check(['high','low','normal'].includes(r.returnRisk));
   if(r.trialState!==undefined)check(['active','reward','done'].includes(r.trialState));
   if(r.tutorial!==undefined)check(typeof r.tutorial==='boolean');if(r.chestBattle!==undefined)check(['active','done'].includes(r.chestBattle));for(const key of ['chestReward','lastLoot'])if(r[key]!==undefined)loot(r[key]);if(r.trialOffers!==undefined){check(Array.isArray(r.trialOffers)&&r.trialOffers.length===3&&new Set(r.trialOffers.map(k=>k.id)).size===3);for(const item of r.trialOffers){loot(item);check(!lootInfo(item.id).trap);}}
   for(const e of r.enemies){if(e.xpReward!==undefined)check(Number.isInteger(e.xpReward)&&number(e.xpReward,0,41));if(e.chestBoss!==undefined)check(typeof e.chestBoss==='boolean');if(e.scale!==undefined)check(e.scale===.7);if(e.fireFieldSpawned!==undefined)check(typeof e.fireFieldSpawned==='boolean');for(const key of ['burnField','pendingFireField'])if(e[key]!==undefined)check(field(e[key]));}
   if(r.rewardChoice!==undefined)check(['weapon','survival','skill'].includes(r.rewardChoice));
   if(r.eventChoice!==undefined)check(['blood','supply','trial'].includes(r.eventChoice));
   if(r.fireZones!==undefined){check(Array.isArray(r.fireZones)&&r.fireZones.length<=24);for(const z of r.fireZones)check(number(z.x,-50,1010)&&number(z.y,-50,590)&&number(z.r,1,150)&&number(z.time,0,2)&&number(z.dps,0,100));}
   for(const e of r.enemies){for(const key of ['frozen','freezeImmune','frostStackTime','opening'])if(e[key]!==undefined)check(number(e[key],0,5));for(const flag of ['frozenDeath','frostShattered'])if(e[flag]!==undefined)check(typeof e[flag]==='boolean');if(e.frostStacks!==undefined)check(Number.isInteger(e.frostStacks)&&e.frostStacks>=0&&e.frostStacks<3);if(e.trialChampion!==undefined)check(typeof e.trialChampion==='boolean');for(const key of ['burnStacks','poisonStacks'])if(e[key]!==undefined){check(Array.isArray(e[key])&&e[key].length<=(key==='burnStacks'?6:8));for(const dot of e[key])check(number(dot.time,0,5)&&number(dot.dps,0,100));}if(e.poisonStacks?.length)check(number(e.poisonRadius,1,150)&&Number.isInteger(e.poisonLevel)&&e.poisonLevel>=1&&e.poisonLevel<=3);}
   if(r.allyZone){const z=r.allyZone;check(number(z.x,0,960)&&number(z.y,0,540)&&number(z.r,1,200)&&number(z.time,0,5));}
   if(r.blasts!==undefined){check(Array.isArray(r.blasts)&&r.blasts.length<=128);for(const b of r.blasts)check(number(b.x,-50,1010)&&number(b.y,-50,590)&&number(b.r,1,120)&&number(b.time,0,2)&&number(b.damage,1,30));}
   for(const e of r.enemies){if(e.variant!==undefined)check(['prism','slime'].includes(e.variant));if(e.variant==='slime')check(Number.isInteger(e.stage)&&e.stage>=0&&e.stage<=2);}
   for(const e of r.enemies)if(e.elite!==undefined)check(['explosive','guardian','volley'].includes(e.elite));
   if(r.hazards!==undefined){check(Array.isArray(r.hazards)&&r.hazards.length<=100);for(const h of r.hazards){check(['aura','puddle'].includes(h.kind)&&['warning','flight','active'].includes(h.phase));check(Number.isInteger(h.owner)&&number(h.x,0,960)&&number(h.y,0,540)&&number(h.r,1,150)&&number(h.time,0,10)&&number(h.flight,0,2)&&number(h.duration,0,10)&&number(h.damage,0,50));if(h.kind==='puddle')check(number(h.fromX,-50,1010)&&number(h.fromY,-50,590));}}
   if(r.obstacles!==undefined){check(Array.isArray(r.obstacles)&&r.obstacles.length<=30);for(const o of r.obstacles)check(number(o.x,25,935)&&number(o.y,40,500)&&number(o.w,1,200)&&number(o.h,1,200)&&['rock','bookshelf','table','bones'].includes(o.type));}
  }
  const reached=new Set([rooms[0]]);let old;do{old=reached.size;for(const a of reached)for(const b of rooms)if(Math.abs(a.x-b.x)+Math.abs(a.y-b.y)===1)reached.add(b);}while(old!==reached.size);check(reached.size===rooms.length);
 }
 if(s.routePreference!==undefined)check(['short','safe'].includes(s.routePreference));
 check(Number.isInteger(s.room)&&s.room>=0&&s.room<s.floors[s.floor].length);check(typeof s.key==='boolean');const p=s.player;check(p&&number(p.hp,0.00001,10000)&&number(p.max,1,10000)&&p.hp<=p.max);if(s.healthVersion===1)check(Number.isInteger(p.hp)&&Number.isInteger(p.max)&&p.max<=10);
 check(number(p.x,0,960)&&number(p.y,0,540)&&number(p.damage,1,10000)&&number(p.speed,1,1000));
 for(const k of ['bonusMove','bonusAttack'])if(p[k]!==undefined)check(number(p[k],0,100));
 if(p.mainSkill!==undefined){check(mainSkills.includes(p.mainSkill));check(mainSkills.every(id=>id===p.mainSkill||!p[id]));}
 if(p.relic!==undefined)check(!!relicInfo(p.relic));
 if(s.bestiary!==undefined){check(s.bestiary&&typeof s.bestiary==='object'&&!Array.isArray(s.bestiary));for(const [k,v] of Object.entries(s.bestiary)){check(Object.hasOwn(enemyGuide,k)&&v&&Number.isInteger(v.kills)&&v.kills>=0&&Array.isArray(v.traits)&&v.traits.length<=3&&v.traits.every(t=>['explosive','guardian','volley'].includes(t)));}}
 const validHit=h=>h&&typeof h.source==='string'&&h.source.length<=120&&number(h.time,0,1e9)&&Number.isInteger(h.floor)&&h.floor>=1&&h.floor<=s.floors.length&&Number.isInteger(h.room)&&h.room>=0&&h.room<s.floors[h.floor-1].length&&number(h.amount,0,10)&&typeof h.blocked==='boolean';
 if(s.metrics!==undefined){check(s.metrics&&typeof s.metrics==='object'&&!Array.isArray(s.metrics));for(const k of ['damageTaken','damageDealt','shields','potionsUsed','ultimatesUsed','dodgesUsed','roomsVisited'])if(s.metrics[k]!==undefined)check(number(s.metrics[k],0,1e12));for(const k of ['floorTimes','floorDamage'])if(s.metrics[k]!==undefined)check(Array.isArray(s.metrics[k])&&s.metrics[k].length<=s.floors.length&&s.metrics[k].every(n=>number(n,0,1e12)));}
 if(s.combatLog!==undefined)check(Array.isArray(s.combatLog)&&s.combatLog.length<=10&&s.combatLog.every(validHit));if(s.lastHit!==undefined)check(validHit(s.lastHit));
 if(p.evolutions!==undefined){check(p.evolutions&&typeof p.evolutions==='object'&&!Array.isArray(p.evolutions));for(const [k,id] of Object.entries(p.evolutions))check(evolutions[k]?.some(e=>e.id===id));}
 for(const k of ['level','xp','potions','food','weapon','armor'])check(Number.isInteger(p[k])&&p[k]>=0&&p[k]<100000);check(p.level>=1);
 for(const k of skillIds)if(p[k]!==undefined)check(Number.isInteger(p[k])&&p[k]>=0&&p[k]<=20);
 check(number(s.elapsed,0,1e9)&&Number.isInteger(s.pendingLevels)&&s.pendingLevels>=0&&s.pendingLevels<100&&Number.isInteger(s.kills)&&s.kills>=0);
 for(const k of ['attack','dodge','skill','invulnerable','shield'])if(s[k]!==undefined)check(number(s[k],0,1000));
 if(s.choices!=null)check(Array.isArray(s.choices)&&s.choices.length<=3&&s.choices.every(k=>skillIds.includes(k)));
 if(s.projectiles!==undefined){check(Array.isArray(s.projectiles)&&s.projectiles.length<2000);for(const b of s.projectiles){check(number(b.x,-100,1100)&&number(b.y,-100,700)&&number(b.vx,-2000,2000)&&number(b.vy,-2000,2000)&&number(b.life,0,20)&&typeof b.enemy==='boolean');if(b.frostShard!==undefined)check(typeof b.frostShard==='boolean');if(b.frostShard)check(!b.enemy&&b.damageScale===1/3&&b.pierce===0);if(b.delay!==undefined)check(number(b.delay,0,.16));if(b.homing!==undefined)check(typeof b.homing==='boolean');check(Array.isArray(b.hit)&&b.hit.length<128);}}
 return s;
}
function fingerprint(text){let hash=2166136261;for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619);return (hash>>>0).toString(16);}
export function parseSave(raw){
 check(typeof raw==='string'&&raw.length<5000000);const decoded=JSON.parse(raw);if(decoded?.schema!==undefined)check(decoded.schema===2&&typeof decoded.payload==='string'&&fingerprint(decoded.payload)===decoded.checksum);
 const s=validateRun(decoded.schema===2?JSON.parse(decoded.payload):decoded);s.runId??='legacy-'+fingerprint(raw);migrateRun(s);s.projectiles??=[];s.floors[s.floor][s.room].seen=true;return s;
}
export function encodeSave(s){validateRun(s);const payload=JSON.stringify(s);return JSON.stringify({schema:2,checksum:fingerprint(payload),savedAt:new Date().toISOString(),release:RELEASE,payload});}
export function safeHistory(storage){try{const rows=JSON.parse(storage.getItem(HISTORY_KEY)||'[]');return Array.isArray(rows)?rows.filter(r=>r&&typeof r.won==='boolean'&&number(r.time,0,1e9)&&number(r.floor,1,6)&&number(r.level,1,100000)).slice(-30):[];}catch{return [];}}
export class RunStore{
 constructor(storage,key=SAVE_KEY){this.storage=storage;this.key=key;}
 read(){
  let main,backup,ended;try{main=this.storage.getItem(this.key);backup=this.storage.getItem(this.key+'.backup');ended=this.storage.getItem(this.key+'.ended');}catch{return {error:'이 브라우저에서 저장 공간을 사용할 수 없습니다.'};}
  for(const [raw,recovered] of [[main,false],[backup,true]])if(raw){try{const run=parseSave(raw);if(run.runId===ended)continue;return {run,recovered};}catch{}}
  return main||backup?{error:'저장이 손상되었거나 종료된 도전입니다. 원본은 보존했습니다.'}:{};
 }
 write(s){
  try{const raw=encodeSave(s),previous=this.storage.getItem(this.key);let same=false;if(previous){try{const old=parseSave(previous);same=old.runId===s.runId;if(same)this.storage.setItem(this.key+'.backup',previous);}catch{}}
   this.storage.setItem(this.key,raw);if(!same)this.storage.removeItem(this.key+'.backup');return {ok:true};
  }catch(error){return {ok:false,error:'저장하지 못했습니다. 저장 공간을 확인하세요.'};}
 }
 complete(s,won){
  try{
   this.storage.setItem(this.key+'.ended',s.runId||'legacy');
   const history=safeHistory(this.storage),id=s.runId||'legacy';
   if(!history.some(row=>row.id===id))history.push({id,won,time:s.elapsed,level:s.player.level,floor:s.floor+1,key:s.key,date:new Date().toISOString(),release:RELEASE,seed:s.seed,metrics:s.metrics,relic:s.player.relic,lastHit:s.lastHit,bestiary:s.bestiary,evolutions:s.player.evolutions||{},build:skillIds.map(k=>[k,s.player[k]||0]),weapon:s.player.weapon});
   this.storage.setItem(HISTORY_KEY,JSON.stringify(history.slice(-30)));
   this.storage.removeItem(this.key);this.storage.removeItem(this.key+'.backup');return {ok:true};
  }catch{return {ok:false,error:'결과를 저장하지 못했습니다. 이 창을 닫기 전에 기록을 내려받으세요.'};}
 }
}
