import {growthRewards} from './growth.js';
import {incantationInfo} from './shrine.js';
import {essenceInfo} from './essences.js';
import {skillIds,mainSkills} from './skill-tree.js';
import {relicInfo} from './relics.js';
import {enemyGuide} from './expedition.js';
import {evolutions} from './evolutions.js';
import {migrateRun} from './progression.js';
import {lootInfo} from './loot.js';
import {skills} from './progression.js';
export const SAVE_KEY='spirebound.run.v1';
export const HISTORY_KEY='spirebound.history';
export const RELEASE='0.31.0-prebeta';
const roomTypes=new Set(['exit','down','up','normal','boss','fountain','treasure','shrine','event']);
const enemyTypes=new Set(['chaser','charger','archer','scatter','brute','laser','ricochet','boss','flower','minislime','strafer','ringcaster','ambusher','astralSniper','gravityMage','starKnight','starBearer','royalGuard','pulseTurret','riftHunter']);
function check(condition){if(!condition)throw new Error('저장 데이터 형식이 올바르지 않습니다.');}
function number(value,min,max){return typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max;}
function finiteTree(value,depth=0){check(depth<15);if(typeof value==='number')check(Number.isFinite(value));if(value&&typeof value==='object')for(const item of Object.values(value))finiteTree(item,depth+1);}
export function validateRun(s){
 const field=z=>z&&number(z.r,1,150)&&number(z.time,0,2)&&number(z.dps,0,1000);
 const loot=item=>{check(item&&lootInfo(item.id));if(['main','support','unique'].includes(item.id)){const skill=skills.find(k=>k.id===item.skill);check(skill&&(item.id==='main'?skill.tree==='main':item.id==='unique'?skill.grade==='unique':skill.tree==='support'&&skill.grade!=='unique'));}else check(item.skill===undefined);if(item.id==='relic')check(!!relicInfo(item.relic));if(item.id==='boss')check(['warden','prism','slime'].includes(item.boss));};
 if(s.combatVersion!==undefined)check(s.combatVersion===17);if(s.tutorialComplete!==undefined)check(typeof s.tutorialComplete==='boolean');
 check(s&&s.version===1&&s.status==='playing');check(s.healthVersion===undefined||s.healthVersion===1);if(s.generationVersion!==undefined)check([12,13,16,17,19,20,23,25].includes(s.generationVersion));if(s.skillSystemVersion!==undefined)check([13,14].includes(s.skillSystemVersion));if(s.volleySide!==undefined)check(s.volleySide===1||s.volleySide===-1);if(s.rerolls!==undefined)check(Number.isInteger(s.rerolls)&&s.rerolls>=0&&s.rerolls<=1);finiteTree(s);
 if(s.thunderClock!==undefined)check(number(s.thunderClock,0,3));
 if(s.returnNoticePending!==undefined)check(typeof s.returnNoticePending==='boolean');if(s.upgrade21!==undefined)check(typeof s.upgrade21==='boolean');if(s.levelQueue!==undefined)check(Array.isArray(s.levelQueue)&&s.levelQueue.length<100&&s.levelQueue.every(n=>Number.isInteger(n)&&n>=2&&n<=s.player.level));if(s.ultimateOffer!==undefined)check(typeof s.ultimateOffer==='boolean');if(s.ultimateMilestones!==undefined)check(Array.isArray(s.ultimateMilestones)&&s.ultimateMilestones.length<=2&&new Set(s.ultimateMilestones).size===s.ultimateMilestones.length&&s.ultimateMilestones.every(n=>[5,10].includes(n)));if(s.passiveClocks!==undefined){check(s.passiveClocks&&typeof s.passiveClocks==='object'&&!Array.isArray(s.passiveClocks));for(const [id,n] of Object.entries(s.passiveClocks))check(['sunFairy','snowFairy','stormFairy','voidBell'].includes(id)&&number(n,0,12));}
 check(Array.isArray(s.floors)&&[2,4,6,8].includes(s.floors.length));check(Number.isInteger(s.floor)&&s.floor>=0&&s.floor<s.floors.length);
 for(const rooms of s.floors){
  check(Array.isArray(rooms)&&rooms.length>=7&&rooms.length<=11);const coords=new Set();
  for(const r of rooms){check(Number.isInteger(r.x)&&Number.isInteger(r.y)&&Math.abs(r.x)<12&&Math.abs(r.y)<12&&roomTypes.has(r.type));check(!coords.has(`${r.x},${r.y}`));coords.add(`${r.x},${r.y}`);check(typeof r.seen==='boolean'&&typeof r.used==='boolean');
   check(Array.isArray(r.enemies)&&r.enemies.length<=128);const ids=new Set();
   for(const e of r.enemies){check(enemyTypes.has(e.type)&&Number.isInteger(e.id)&&!ids.has(e.id));ids.add(e.id);check(number(e.x,-50,1010)&&number(e.y,-50,590)&&number(e.max,1,100000)&&number(e.hp,-100000,e.max));}
   if(r.shrineState!==undefined){check(r.type==='shrine'&&['sealed','active','choice','done'].includes(r.shrineState));if(r.shrineState==='done')check(r.used);if(r.shrineState==='choice')check(!r.used&&r.incantations?.length===2);}
   if(r.incantations!==undefined)check(Array.isArray(r.incantations)&&r.incantations.length===2&&new Set(r.incantations).size===2&&r.incantations.every(id=>incantationInfo(id)));if(r.incantationChoice!==undefined)check(r.incantations?.includes(r.incantationChoice)&&r.used);if(r.incantationRelic!==undefined)check(!!relicInfo(r.incantationRelic));
   for(const key of ['hasChest','chestUsed','kingPending','gate','rest','deployed','intro'])if(r[key]!==undefined)check(typeof r[key]==='boolean');
   for(const key of ['objectPosition','chestPosition'])if(r[key]!==undefined)check(r[key]&&number(r[key].x,100,860)&&number(r[key].y,90,450));
   if(r.returnSeal!==undefined){check(['open','stairs','clear','guardian'].includes(r.returnSeal)&&typeof r.returnSealReleased==='boolean'&&typeof r.seenOnAscent==='boolean');if(r.returnSeal==='guardian'&&!r.returnSealReleased)check(Number.isInteger(r.returnGuardianId)&&r.returnGuardianId>=0);}
   if(r.gateBanner!==undefined)check(number(r.gateBanner,0,3));if(r.elitePotionDropped!==undefined)check(typeof r.elitePotionDropped==='boolean');if(r.bossTotalHp!==undefined)check(number(r.bossTotalHp,1,1e6));
   for(const e of r.enemies){if(e.summoned!==undefined)check(typeof e.summoned==='boolean');if(e.summoner!==undefined)check(Number.isInteger(e.summoner)&&e.summoner>=0);if(e.summonClock!==undefined)check(number(e.summonClock,0,10));if(e.gasClock!==undefined)check(number(e.gasClock,0,6));if(e.phase==='splitJump'){check(number(e.phaseTime,0,1.1));for(const key of ['launchX','landX'])check(number(e[key],0,960));for(const key of ['launchY','landY'])check(number(e[key],0,540));}}
   if(r.essences!==undefined){check(Array.isArray(r.essences)&&r.essences.length<=1000);for(const e of r.essences)check(!!essenceInfo(e.id)&&number(e.x,-50,1010)&&number(e.y,-50,590));}
   if(r.relicOffers!==undefined)check(Array.isArray(r.relicOffers)&&r.relicOffers.length<=3&&new Set(r.relicOffers).size===r.relicOffers.length&&r.relicOffers.every(id=>relicInfo(id))&&typeof r.relicClaimed==='boolean');
   if(r.returnRisk!==undefined)check(['high','low','normal'].includes(r.returnRisk));
   if(r.trialState!==undefined)check(['active','reward','done'].includes(r.trialState));
   if(r.tutorial!==undefined)check(typeof r.tutorial==='boolean');if(r.chestBattle!==undefined)check(['active','done'].includes(r.chestBattle));for(const key of ['chestReward','lastLoot'])if(r[key]!==undefined)loot(r[key]);if(r.trialOffers!==undefined){check(Array.isArray(r.trialOffers)&&r.trialOffers.length===3&&new Set(r.trialOffers.map(k=>k.id)).size===3);for(const item of r.trialOffers){loot(item);check(!lootInfo(item.id).trap);}}
   for(const e of r.enemies){if(e.xpReward!==undefined)check(Number.isInteger(e.xpReward)&&number(e.xpReward,0,41));if(e.chestBoss!==undefined)check(typeof e.chestBoss==='boolean');if(e.scale!==undefined)check(e.scale===.7);if(e.fireFieldSpawned!==undefined)check(typeof e.fireFieldSpawned==='boolean');for(const key of ['burnField','pendingFireField'])if(e[key]!==undefined)check(field(e[key]));}
   if(r.rewardChoice!==undefined)check(['weapon','survival','skill'].includes(r.rewardChoice));
   if(r.eventChoice!==undefined)check(['blood','supply','trial'].includes(r.eventChoice));
   if(r.fireZones!==undefined){check(Array.isArray(r.fireZones)&&r.fireZones.length<=24);for(const z of r.fireZones)check(number(z.x,-50,1010)&&number(z.y,-50,590)&&number(z.r,1,150)&&number(z.time,0,2)&&number(z.dps,0,1000));}
   for(const e of r.enemies){if(e.burnClock!==undefined)check(number(e.burnClock,0,.5));if(e.burnAccrued!==undefined)check(number(e.burnAccrued,0,10000));for(const key of ['frozen','freezeImmune','frostStackTime','opening'])if(e[key]!==undefined)check(number(e[key],0,5));for(const flag of ['frozenDeath','frostShattered'])if(e[flag]!==undefined)check(typeof e[flag]==='boolean');if(e.frostStacks!==undefined)check(Number.isInteger(e.frostStacks)&&e.frostStacks>=0&&e.frostStacks<=3);if(e.trialChampion!==undefined)check(typeof e.trialChampion==='boolean');for(const key of ['burnStacks','poisonStacks'])if(e[key]!==undefined){check(Array.isArray(e[key])&&e[key].length<=(key==='burnStacks'?6:8));for(const dot of e[key])check(number(dot.time,0,5)&&number(dot.dps,0,1000));}for(const key of ['poisonGasDps','poisonBlast'])if(e[key]!==undefined)check(number(e[key],0,1000));if(e.poisonStacks?.length)check(number(e.poisonRadius,1,150)&&Number.isInteger(e.poisonLevel)&&e.poisonLevel>=1&&e.poisonLevel<=3);}
   if(r.passiveArcs!==undefined){check(Array.isArray(r.passiveArcs)&&r.passiveArcs.length<=128);for(const a of r.passiveArcs)check(number(a.x,-50,1010)&&number(a.toX,-50,1010)&&number(a.y,-50,590)&&number(a.toY,-50,590)&&number(a.time,0,.2));}
   if(r.arrowRain){const z=r.arrowRain;check(number(z.x,0,960)&&number(z.y,0,540)&&z.r===280&&number(z.elapsed,0,1.8)&&Number.isInteger(z.pulses)&&number(z.pulses,0,3)&&number(z.damage,0,100000));}if(r.turrets!==undefined){check(Array.isArray(r.turrets)&&r.turrets.length<=2);for(const t of r.turrets)check(number(t.x,0,960)&&number(t.y,0,540)&&number(t.time,0,19)&&number(t.clock,0,.8)&&number(t.aim,-Math.PI,Math.PI));}if(r.voidPull){const z=r.voidPull;check(number(z.x,-50,1010)&&number(z.y,-50,590)&&number(z.time,0,1));}
   for(const e of r.enemies){if(e.fairyBurn)check(number(e.fairyBurn.time,0,3)&&number(e.fairyBurn.dps,0,100000));if(e.frostAttackFactor!==undefined)check(number(e.frostAttackFactor,.5,1));if(e.orbitHit!==undefined)check(number(e.orbitHit,0,.6));if(e.passiveKilled!==undefined)check(typeof e.passiveKilled==='boolean');}
   if(r.allyZone){const z=r.allyZone;check(number(z.x,0,960)&&number(z.y,0,540)&&number(z.r,1,200)&&number(z.time,0,5));}
   if(r.blasts!==undefined){check(Array.isArray(r.blasts)&&r.blasts.length<=128);for(const b of r.blasts)check(number(b.x,-50,1010)&&number(b.y,-50,590)&&number(b.r,1,120)&&number(b.time,0,2)&&number(b.damage,1,30));}
   for(const e of r.enemies){if(e.counterReason!==undefined)check(['cover','evade'].includes(e.counterReason));if(e.slimeShotClock!==undefined)check(number(e.slimeShotClock,0,4));if(e.darkAttack){const a=e.darkAttack;check(['slash','dash','blink','mark','fan','ring','judgment'].includes(a.kind)&&number(a.time,0,1.1)&&Number.isInteger(a.step)&&number(a.step,0,4)&&number(a.x,-50,1010)&&number(a.y,-50,590)&&number(a.tx,0,960)&&number(a.ty,0,540)&&number(a.aim,-Math.PI,Math.PI));}if(e.gravity)check(number(e.gravity.x,0,960)&&number(e.gravity.y,0,540)&&number(e.gravity.time,0,2.4));if(e.guardClock!==undefined)check(number(e.guardClock,0,10));if(e.kingStage!==undefined)check([1,2,3].includes(e.kingStage));if(e.kingTransition!==undefined)check(number(e.kingTransition,0,1.4));if(e.kneel!==undefined)check(number(e.kneel,0,2.2));if(e.guardPortal)check(number(e.guardPortal.x,0,960)&&number(e.guardPortal.y,0,540)&&number(e.guardPortal.time,0,1));if(e.lastDarkAttack!==undefined)check(['slash','dash','blink','mark','fan','ring','judgment'].includes(e.lastDarkAttack));if(e.judgmentTurn!==undefined)check([0,1].includes(e.judgmentTurn));if(e.darkAttack){const a=e.darkAttack;if(a.axis!==undefined)check(['horizontal','vertical'].includes(a.axis));if(a.moving!==undefined)check(typeof a.moving==='boolean'&&a.kind==='dash');if(a.elapsed!==undefined)check(number(a.elapsed,0,.32));for(const k of ['hit','finisher','coverStopped','landed'])if(a[k]!==undefined)check(typeof a[k]==='boolean');}if(e.darkFlash)check(number(e.darkFlash.time,0,.18)&&['slash','dash','blink','mark','fan','ring','judgment'].includes(e.darkFlash.kind));}
   for(const e of r.enemies){if(e.variant!==undefined)check(['prism','slime','king'].includes(e.variant));if(e.variant==='slime')check(Number.isInteger(e.stage)&&e.stage>=0&&e.stage<=2);}
   for(const e of r.enemies)if(e.elite!==undefined)check(['explosive','guardian','volley'].includes(e.elite));
   if(r.hazards!==undefined){check(Array.isArray(r.hazards)&&r.hazards.length<=100);for(const h of r.hazards){check(['aura','puddle'].includes(h.kind)&&['warning','flight','active'].includes(h.phase));if(h.closeGas!==undefined)check(typeof h.closeGas==='boolean');check(Number.isInteger(h.owner)&&number(h.x,0,960)&&number(h.y,0,540)&&number(h.r,1,150)&&number(h.time,0,10)&&number(h.flight,0,2)&&number(h.duration,0,10)&&number(h.damage,0,50));if(h.kind==='puddle')check(number(h.fromX,-50,1010)&&number(h.fromY,-50,590));}}
   if(r.obstacles!==undefined){check(Array.isArray(r.obstacles)&&r.obstacles.length<=30);for(const o of r.obstacles)check(number(o.x,25,935)&&number(o.y,40,500)&&number(o.w,1,200)&&number(o.h,1,200)&&['rock','bookshelf','table','bones','wall'].includes(o.type));}
  }
  const reached=new Set([rooms[0]]);let old;do{old=reached.size;for(const a of reached)for(const b of rooms)if(Math.abs(a.x-b.x)+Math.abs(a.y-b.y)===1)reached.add(b);}while(old!==reached.size);check(reached.size===rooms.length);
 }
 if(s.routePreference!==undefined)check(['short','safe'].includes(s.routePreference));
 check(Number.isInteger(s.room)&&s.room>=0&&s.room<s.floors[s.floor].length);check(typeof s.key==='boolean');const p=s.player;check(p&&number(p.hp,0.00001,10000)&&number(p.max,1,10000)&&p.hp<=p.max);if(s.healthVersion===1)check(Number.isInteger(p.hp)&&Number.isInteger(p.max)&&p.max<=1000);
 check(number(p.x,0,960)&&number(p.y,0,540)&&number(p.damage,1,10000)&&number(p.speed,1,1000));
 for(const k of ['bonusMove','bonusAttack'])if(p[k]!==undefined)check(number(p[k],0,100));
 if(p.essenceCounts!==undefined){check(p.essenceCounts&&typeof p.essenceCounts==='object'&&!Array.isArray(p.essenceCounts));for(const [id,n] of Object.entries(p.essenceCounts))check(!!essenceInfo(id)&&Number.isInteger(n)&&number(n,0,10000));}
 if(p.hexes!==undefined){check(p.hexes&&typeof p.hexes==='object'&&!Array.isArray(p.hexes));for(const [key,value] of Object.entries(p.hexes))check(['damage','attack','move','ultimate','blink','reach'].includes(key)&&number(value,.01,100));}if(p.shrineShield!==undefined)check(number(p.shrineShield,0,100));if(p.incantations!==undefined)check(Array.isArray(p.incantations)&&p.incantations.length<=20&&p.incantations.every(id=>incantationInfo(id)));
 if(p.mainSkill!==undefined){check(mainSkills.includes(p.mainSkill));check(mainSkills.every(id=>id===p.mainSkill||!p[id]));}
 if(p.relics!==undefined)check(Array.isArray(p.relics)&&p.relics.length<=32&&new Set(p.relics).size===p.relics.length&&p.relics.every(id=>relicInfo(id)));if(p.ultimateEssences!==undefined)check(Number.isInteger(p.ultimateEssences)&&number(p.ultimateEssences,0,10000));
 if(p.relic!==undefined)check(!!relicInfo(p.relic));
 if(s.bestiary!==undefined){check(s.bestiary&&typeof s.bestiary==='object'&&!Array.isArray(s.bestiary));for(const [k,v] of Object.entries(s.bestiary)){check(Object.hasOwn(enemyGuide,k)&&v&&Number.isInteger(v.kills)&&v.kills>=0&&Array.isArray(v.traits)&&v.traits.length<=3&&v.traits.every(t=>['explosive','guardian','volley'].includes(t)));}}
 const validHit=h=>h&&typeof h.source==='string'&&h.source.length<=120&&number(h.time,0,1e9)&&Number.isInteger(h.floor)&&h.floor>=1&&h.floor<=s.floors.length&&Number.isInteger(h.room)&&h.room>=0&&h.room<s.floors[h.floor-1].length&&number(h.amount,0,10)&&typeof h.blocked==='boolean';
 if(s.metrics!==undefined){check(s.metrics&&typeof s.metrics==='object'&&!Array.isArray(s.metrics));for(const k of ['damageTaken','damageDealt','ultimateDamage','shields','potionsUsed','ultimatesUsed','dodgesUsed','roomsVisited'])if(s.metrics[k]!==undefined)check(number(s.metrics[k],0,1e12));for(const k of ['floorTimes','floorDamage'])if(s.metrics[k]!==undefined)check(Array.isArray(s.metrics[k])&&s.metrics[k].length<=s.floors.length&&s.metrics[k].every(n=>number(n,0,1e12)));}
 if(s.combatLog!==undefined)check(Array.isArray(s.combatLog)&&s.combatLog.length<=10&&s.combatLog.every(validHit));if(s.lastHit!==undefined)check(validHit(s.lastHit));
 if(p.ultimate!==undefined)check(p.ultimate===0||p.ultimate===1);
 if(p.evolutions!==undefined){check(p.evolutions&&typeof p.evolutions==='object'&&!Array.isArray(p.evolutions));for(const [k,id] of Object.entries(p.evolutions))check(evolutions[k]?.some(e=>e.id===id)||!s.upgrade21&&k==='ultimate'&&id==='field');}
 for(const k of ['level','xp','potions','food','weapon','armor'])check(Number.isInteger(p[k])&&p[k]>=0&&p[k]<100000);check(p.level>=1);
 for(const k of skillIds)if(p[k]!==undefined)check(Number.isInteger(p[k])&&p[k]>=0&&p[k]<=20);
 check(number(s.elapsed,0,1e9)&&Number.isInteger(s.pendingLevels)&&s.pendingLevels>=0&&s.pendingLevels<100&&Number.isInteger(s.kills)&&s.kills>=0);
 for(const k of ['attack','dodge','skill','invulnerable','shield','auraShield','potionCooldown'])if(s[k]!==undefined)check(number(s[k],0,1000));
 if(s.metrics?.growthEntries!==undefined){const a=s.metrics.growthEntries;check(Array.isArray(a)&&a.length<=s.floors.length*2);const seen=new Set();for(const r of a){check(r&&(Number.isInteger(r.floor)&&number(r.floor,0,s.floors.length-1))&&['ascent','descent'].includes(r.phase));const key=r.floor+':'+r.phase;check(!seen.has(key));seen.add(key);for(const k of ['level','damage','max','relics','potions'])check(number(r[k],0,1e12));}}
 if(s.metrics?.bossRecords!==undefined){const a=s.metrics.bossRecords;check(Array.isArray(a)&&a.length<=s.floors.length);const seen=new Set();for(const r of a){check(r&&(Number.isInteger(r.floor)&&number(r.floor,0,s.floors.length-1))&&number(r.seconds,0,1e12)&&typeof r.complete==='boolean'&&!seen.has(r.floor));seen.add(r.floor);}}
 if(s.choices!=null)check(Array.isArray(s.choices)&&s.choices.length<=3&&s.choices.every(k=>skillIds.includes(k)||growthRewards.some(r=>r.id===k)));
 if(s.projectiles!==undefined){check(Array.isArray(s.projectiles)&&s.projectiles.length<2000);for(const b of s.projectiles){check(number(b.x,-100,1100)&&number(b.y,-100,700)&&number(b.vx,-2000,2000)&&number(b.vy,-2000,2000)&&number(b.life,0,20)&&typeof b.enemy==='boolean');if(b.shardSize!==undefined)check([.5,1,1.5].includes(b.shardSize));if(b.passive!==undefined)check(!b.enemy&&['sunFairy','snowFairy','stormFairy','turret'].includes(b.passive)&&number(b.passiveDamage,0,100000));if(b.poisonShot!==undefined)check(['needle','orb'].includes(b.poisonShot));if(b.frostShard!==undefined)check(typeof b.frostShard==='boolean');if(b.frostShard)check(!b.enemy&&number(b.damageScale,.3,.51)&&b.pierce===0);if(b.delay!==undefined)check(number(b.delay,0,.16));if(b.homing!==undefined)check(typeof b.homing==='boolean');check(Array.isArray(b.hit)&&b.hit.length<128);}}
 return s;
}
function fingerprint(text){let hash=2166136261;for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619);return (hash>>>0).toString(16);}
export function parseSave(raw){
 check(typeof raw==='string'&&raw.length<5000000);const decoded=JSON.parse(raw);if(decoded?.schema!==undefined)check(decoded.schema===2&&typeof decoded.payload==='string'&&fingerprint(decoded.payload)===decoded.checksum);
 const s=validateRun(decoded.schema===2?JSON.parse(decoded.payload):decoded);s.runId??='legacy-'+fingerprint(raw);migrateRun(s);s.projectiles??=[];s.floors[s.floor][s.room].seen=true;return s;
}
export function encodeSave(s){validateRun(s);const payload=JSON.stringify(s);return JSON.stringify({schema:2,checksum:fingerprint(payload),savedAt:new Date().toISOString(),release:RELEASE,payload});}
export function safeHistory(storage){try{const rows=JSON.parse(storage.getItem(HISTORY_KEY)||'[]');return Array.isArray(rows)?rows.filter(r=>r&&typeof r.won==='boolean'&&number(r.time,0,1e9)&&number(r.floor,1,8)&&number(r.level,1,100000)).slice(-30):[];}catch{return [];}}
export class RunStore{
 constructor(storage,key=SAVE_KEY){this.storage=storage;this.key=key;}
 read(){
  let main,backup,ended;try{main=this.storage.getItem(this.key);backup=this.storage.getItem(this.key+'.backup');ended=this.storage.getItem(this.key+'.ended');}catch{return {error:'이 브라우저에서 저장 공간을 사용할 수 없습니다.'};}
  for(const [raw,recovered] of [[main,false],[backup,true]])if(raw){try{const run=parseSave(raw);if(run.runId===ended)continue;return {run,recovered};}catch{}}
  return main||backup?{error:'저장이 손상되었거나 종료된 도전입니다. 원본은 보존했습니다.'}:{};
 }
 write(s){
  if(s.practice)return {ok:true,practice:true};
  try{const raw=encodeSave(s),previous=this.storage.getItem(this.key);let same=false;if(previous){try{const old=parseSave(previous);same=old.runId===s.runId;if(same)this.storage.setItem(this.key+'.backup',previous);}catch{}}
   this.storage.setItem(this.key,raw);if(!same)this.storage.removeItem(this.key+'.backup');return {ok:true};
  }catch(error){return {ok:false,error:'저장하지 못했습니다. 저장 공간을 확인하세요.'};}
 }
 complete(s,won){
  if(s.practice)return {ok:true,practice:true};
  try{
   this.storage.setItem(this.key+'.ended',s.runId||'legacy');
   const history=safeHistory(this.storage),id=s.runId||'legacy';
   if(!history.some(row=>row.id===id))history.push({id,won,time:s.elapsed,level:s.player.level,floor:s.floor+1,key:s.key,date:new Date().toISOString(),release:RELEASE,seed:s.seed,metrics:s.metrics,relic:s.player.relic,relics:s.player.relics,lastHit:s.lastHit,bestiary:s.bestiary,evolutions:s.player.evolutions||{},build:skillIds.map(k=>[k,s.player[k]||0]),weapon:s.player.weapon});
   this.storage.setItem(HISTORY_KEY,JSON.stringify(history.slice(-30)));
   this.storage.removeItem(this.key);this.storage.removeItem(this.key+'.backup');return {ok:true};
  }catch{return {ok:false,error:'결과를 저장하지 못했습니다. 이 창을 닫기 전에 기록을 내려받으세요.'};}
 }
}
