import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,enrage,currentRoom} from '../../src/game/engine.js';
import {enterRoom,stepRun} from '../../src/game/simulation.js';
import {SUPPORT,tickSupportState,supportTypes,strengthenCantor} from '../../src/combat/support-profile.js';
import {updateSupportCaster,updateSupportMinion,supportSpawnPoint,supportHealTarget,validSupportHeal,cleanupSupportMinions} from '../../src/combat/support-casters.js';
import {planSupportEncounters} from '../../src/world/support-encounters.js';
import {enemyXpReward,enemyEssenceChance} from '../../src/progression/enemy-rewards.js';
import {weaponContactReplaced} from '../../src/combat/enemy-melee.js';
import {supportPose,drawSupportEffects} from '../../src/rendering/support-sprites.js';
import {enemyDeathEffect} from '../../src/rendering/enemy-feedback.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
import {assetPlanFiles,portraitAssetPlan} from '../../src/rendering/asset-packs.js';

function combat(type='ossuarySummoner'){
 const e={id:0,type,x:500,y:270,hp:200,max:200,cd:99,supportClock:0,supportSummons:0,supportHeals:0,tier:2},p={x:150,y:270};
 const ally={id:1,type:'chaser',x:620,y:270,hp:20,max:100,cd:99},other={id:2,type:'chaser',x:650,y:380,hp:100,max:100,cd:99};return {e,p,ally,other,r:{enemies:[e,ally,other],obstacles:[]}};
}
function finish(e,p,r){updateSupportCaster(e,p,r,e.type==='ossuarySummoner'?SUPPORT.cast:SUPPORT.healCast,[]);}
function active(type='ossuarySummoner'){
 const s=newRun(47);let found;s.floors.forEach((f,floor)=>f.forEach((r,index)=>{if(!found&&r.supportEncounter?.ascent)found={r,floor,index};}));assert.ok(found,'seed contains a support plan');
 const r=found.r;r.supportEncounter.ascent.type=type;r.obstacles=[];s.floor=found.floor;s.room=found.index;Object.assign(s.player,{x:65,y:270});enterRoom(s);const e=r.enemies.find(e=>e.type===type);assert.ok(e);return {s,r,e,p:s.player};
}
function child(e,id=100){return {id,type:'ossuaryMinion',x:e.x-60,y:e.y+50,hp:50,max:50,cd:99,spawnGrace:.6,summoned:true,summonOwner:e.id,supportLife:18,balanceVersion:1,tier:2};}
test('summoning commits one fixed, safe point and allocates a new non-rewarding stone actor',()=>{
 const {e,p,r}=combat();updateSupportCaster(e,p,r,.01,[]);assert.equal(e.attackPhase,'supportCast');const at={...e.supportSpawn};assert.ok(Math.cos(e.aim)*(at.x-e.x)>=0);p.y=400;finish(e,p,r);const minion=r.enemies.find(e=>e.type==='ossuaryMinion');assert.ok(minion);assert.equal(minion.x,at.x);assert.equal(minion.y,at.y);assert.equal(e.supportSummons,1);assert.equal(minion.summoned,true);assert.equal(enemyXpReward(minion),0);assert.equal(enemyEssenceChance(minion,r),0);
});
test('live owner/room caps, lifetime summon budget and total enemy cap prevent unbounded spawning',()=>{
 const {e,p,r}=combat();r.enemies.push(child(e,3),child(e,4));assert.equal(supportSpawnPoint(e,p,r),null);r.enemies.at(-1).hp=0;assert.ok(supportSpawnPoint(e,p,r));e.supportSummons=4;assert.equal(supportSpawnPoint(e,p,r),null);
 e.supportSummons=0;r.enemies=r.enemies.slice(0,3);for(let i=0;i<4;i++)r.enemies.push({...child(e,3+i),summonOwner:99});assert.equal(supportSpawnPoint(e,p,r),null);r.enemies=r.enemies.slice(0,3);while(r.enemies.length<64)r.enemies.push({id:r.enemies.length,type:'chaser',hp:1,x:800,y:400});assert.equal(supportSpawnPoint(e,p,r),null);
});
test('blocked or occupied fixed spawn point fails without moving it or charging the lifetime budget',()=>{
 const {e,p,r}=combat();updateSupportCaster(e,p,r,.01,[]);const at=e.supportSpawn;r.obstacles=[{x:at.x-20,y:at.y-20,w:40,h:40}];finish(e,p,r);assert.equal(r.enemies.length,3);assert.equal(e.supportSummons,0);assert.equal(e.supportClock,6);
});
test('cast damage threshold, freeze and opening interrupt both support warnings before release',()=>{
 for(const kind of ['damage','frozen','opening']){const {e,p,r}=combat();updateSupportCaster(e,p,r,.01,[]);if(kind==='damage')e.hp=180;else e[kind]=1;tickSupportState(e,.01);assert.equal(e.attackPhase,'supportRecover');assert.equal(e.supportSpawn,undefined);assert.equal(e.supportSummons,0);assert.equal(e.supportFlash.kind,'interrupt');}
 const {e,p,r}=combat();updateSupportCaster(e,p,r,.01,[]);e.hp=190;tickSupportState(e,.01);assert.equal(e.attackPhase,'supportCast');
});
test('same-step legacy burn interrupts a finishing cast before it can summon or heal',()=>{
 for(const type of supportTypes){const {s,r,e,p}=active(type);r.obstacles=[];r.enemies=[e,{id:100,type:'chaser',x:620,y:270,hp:20,max:100,cd:99,balanceVersion:1}];Object.assign(e,{x:500,y:270,spawnGrace:0,attackPhase:'supportCast',attackTime:.01,supportCastHp:e.hp,burn:.02,burnDamage:e.max*10,supportClock:0});if(type==='ossuarySummoner')e.supportSpawn={x:600,y:350};else e.supportTarget=100;p.critChance=0;s.attack=99;s.entryGrace=0;stepRun(s,.02);assert.equal(e.attackPhase,'supportRecover');assert.equal(e.supportFlash.kind,'interrupt');assert.equal(r.enemies.filter(e=>e.type==='ossuaryMinion').length,0);assert.equal(r.enemies.find(e=>e.id===100).hp,20);}
});
test('healer selects the most injured eligible ally, excluding bosses, pursuers, summons, self and walls',()=>{
 const {e,p,r,ally}=combat('choirCantor');e.hp=1;r.enemies.push({id:3,type:'boss',x:510,y:270,hp:1,max:100},{id:4,type:'pursuer',x:510,y:270,hp:1,max:100},{...child(e,5),hp:1});assert.equal(supportHealTarget(e,r),ally);r.obstacles=[{x:550,y:245,w:20,h:45}];assert.equal(supportHealTarget(e,r),null);
 r.obstacles=[];ally.x=800;assert.equal(validSupportHeal(e,ally,r),false);assert.equal(validSupportHeal(e,e,r),false);
});
test('heals restore twenty percent without a fixed cap or lifetime limit and never overfill',()=>{
 for(const [max,hp,amount] of [[100,20,20],[1000,100,200],[1000,995,5]]){const {e,p,r,ally}=combat('choirCantor');Object.assign(ally,{max,hp});updateSupportCaster(e,p,r,.01,[]);finish(e,p,r);assert.equal(ally.hp,hp+amount);assert.equal(e.supportHeals,1);assert.equal(e.supportFlash.amount,amount);assert.equal(e.supportClock,4);}
 const {e,p,r,ally}=combat('choirCantor');e.supportHeals=300;updateSupportCaster(e,p,r,.01,[]);assert.equal(e.attackPhase,'supportCast');finish(e,p,r);assert.equal(e.supportHeals,301);assert.equal(ally.hp,40);
});

test('cantor health scales once, preserves injury and cast damage, and leaves summoners unchanged',()=>{
 const {e}=combat('choirCantor');Object.assign(e,{hp:100,supportCastHp:150,attackPhase:'supportCast',attackTime:.95,supportClock:5.5,supportHeals:3});strengthenCantor(e);
 assert.equal(e.max,280);assert.equal(e.hp,140);assert.equal(e.supportCastHp,210);assert.equal(e.attackTime,.8);assert.equal(e.supportClock,4);assert.equal(e.supportHeals,3);
 const before=JSON.stringify(e);strengthenCantor(e);assert.equal(JSON.stringify(e),before);
 const dead={type:'choirCantor',hp:0,max:200};strengthenCantor(dead);assert.equal(dead.hp,0);
 const other=combat().e,original=JSON.stringify(other);strengthenCantor(other);assert.equal(JSON.stringify(other),original);
});

test('legacy cantor casts and large heal counters roundtrip without repeating health migration',()=>{
 const {s,r,e}=active('choirCantor');delete e.cantorBalanceVersion;Object.assign(e,{max:200,hp:100,supportCastHp:150,attackPhase:'supportCast',attackTime:.95,supportTarget:r.enemies.find(n=>n!==e).id,supportClock:5.5,supportHeals:3});
 const restored=parseSave(encodeSave(s)),actor=currentRoom(restored).enemies.find(n=>n.id===e.id);
 assert.equal(actor.max,280);assert.equal(actor.hp,140);assert.equal(actor.attackTime,.8);assert.equal(actor.supportCastHp,210);
 actor.supportHeals=1000;actor.supportFlash={kind:'heal',time:.4,x:actor.x,y:actor.y,amount:200};
 const again=parseSave(encodeSave(restored)),copy=currentRoom(again).enemies.find(n=>n.id===e.id);assert.equal(copy.supportHeals,1000);assert.equal(copy.max,280);assert.equal(copy.supportFlash.amount,200);
 for(const value of [-1,1.5,Number.MAX_SAFE_INTEGER+1]){const bad=structuredClone(again);currentRoom(bad).enemies.find(n=>n.id===e.id).supportHeals=value;assert.throws(()=>encodeSave(bad));}
});

test('cantor movement is faster than summoner movement with the same path and slow status',()=>{
 const cantor=combat('choirCantor'),summoner=combat();for(const q of [cantor,summoner]){q.e.supportClock=2;q.e.slow=0;q.e.frozen=0;}
 updateSupportCaster(cantor.e,cantor.p,cantor.r,.1,[]);updateSupportCaster(summoner.e,summoner.p,summoner.r,.1,[]);
 const moved=q=>Math.hypot(q.e.x-500,q.e.y-270);assert.ok(moved(cantor)>moved(summoner));assert.ok(Math.abs(moved(cantor)/moved(summoner)-50/35)<1e-6);
});
test('a lost target or broken healing sightline interrupts rather than silently retargeting',()=>{
 for(const dead of [true,false]){const {e,p,r,ally,other}=combat('choirCantor');other.hp=50;updateSupportCaster(e,p,r,.01,[]);assert.equal(e.supportTarget,ally.id);if(dead)ally.hp=0;else r.obstacles=[{x:550,y:245,w:20,h:45}];finish(e,p,r);assert.equal(other.hp,50);assert.equal(e.supportHeals,0);assert.equal(e.attackPhase,'supportRecover');assert.equal(e.supportTarget,undefined);}
});
test('fallback bolt keeps its warned direction and remains a normal blockable enemy projectile',()=>{
 const {e,p,r}=combat();e.supportSummons=4;e.cd=0;p.x=200;const bullets=[];updateSupportCaster(e,p,r,.01,bullets);assert.equal(e.attackPhase,'supportBolt');const aim=e.aim;p.y=400;updateSupportCaster(e,p,r,.55,bullets);assert.equal(bullets.length,1);assert.equal(bullets[0].vx,Math.cos(aim)*165);assert.equal(bullets[0].vy,Math.sin(aim)*165);assert.equal(bullets[0].enemy,true);assert.equal(bullets[0].damage,9);
});
test('stone fist uses a distinct warning, one strike and no passive contact damage',()=>{
 const {e,p,r}=combat();const m={...child(e),x:300,y:270,cd:0};p.x=340;const hits=[];updateSupportMinion(m,p,r,.01,(...h)=>hits.push(h));assert.equal(m.attackPhase,'minionWarning');assert.equal(hits.length,0);updateSupportMinion(m,p,r,.35,(...h)=>hits.push(h));updateSupportMinion(m,p,r,.01,(...h)=>hits.push(h));updateSupportMinion(m,p,r,.01,(...h)=>hits.push(h));assert.equal(hits.length,1);assert.equal(hits[0][0],9);for(const type of [...supportTypes,'ossuaryMinion'])assert.equal(weaponContactReplaced({type}),true);
});
test('lifetime expiry never generates XP, potions, essence, ranking kills or player DPS',()=>{
 const {s,r,e}=active();r.enemies=[e];e.cd=99;e.supportClock=6;const m=child(e);m.supportLife=.01;r.enemies.push(m);s.attack=99;s.entryGrace=1;stepRun(s,.02);assert.equal(r.enemies.some(e=>e.type==='ossuaryMinion'),false);assert.equal(s.metrics.damageDealt,0);assert.equal(s.kills,0);assert.equal(s.ranking.defeated.length,0);assert.equal(r.xpDroppedTotal||0,0);assert.equal((r.essences||[]).length,0);
});
test('owner defeat removes its army in the same step without farming damage or death shards',()=>{
 const {s,r,e,p}=active();r.enemies=[e];e.hp=0;const m=child(e);m.frozen=1;m.frostStackTime=2;m.frostStacks=3;r.enemies.push(m);s.attack=99;s.entryGrace=1;p.frost=1;stepRun(s,.01);assert.equal(r.enemies.length,0);assert.equal(s.kills,1);assert.equal(s.ranking.defeated.length,1);assert.equal(s.metrics.damageDealt,0);assert.equal(r.xpDroppedTotal,24);assert.equal(s.projectiles.length,0);assert.equal(r.supportEncounter.ascent.state,'defeated');
});
test('room planning respects the shared support budget and excludes special threats across seeded maps',()=>{
 const kinds=new Set();for(let seed=1;seed<=12;seed++){const s=newRun(seed);assert.deepEqual(s.supportPlannedPhases,['ascent']);for(const r of s.floors.flat())if(r.supportEncounter?.ascent){kinds.add(r.supportEncounter.ascent.type);assert.equal(r.type,'normal');assert.ok(!r.hasChest&&!r.gate&&!r.tutorial);assert.ok(!r.enemies.some(e=>['starBearer','gravityMage'].includes(e.type)));assert.ok(!['planned','active'].includes(r.specialEncounter?.state));}const before=s.randomState;planSupportEncounters(s);assert.equal(s.randomState,before);}assert.equal(kinds.size,2);
});
test('reentry preserves lifetime budgets and return regeneration retires ascent support records',()=>{
 const {s,r,e}=active();e.supportSummons=2;e.hp-=10;const hp=e.hp;enterRoom(s);assert.equal(e.hp,hp);assert.equal(e.supportSummons,2);enrage(s);assert.equal(r.supportEncounter.ascent.state,'cancelled');assert.ok(s.supportPlannedPhases.includes('descent'));assert.ok(parseSave(encodeSave(s)));
});
test('active cast and owner-linked minions roundtrip while malformed budgets and links reject',()=>{
 const {s,r,e,p}=active();r.obstacles=[];r.enemies=[e];Object.assign(e,{x:500,y:270,cd:99,supportClock:0});Object.assign(p,{x:150,y:270});updateSupportCaster(e,p,r,.01,[]);assert.equal(e.attackPhase,'supportCast');const restored=parseSave(encodeSave(s));assert.ok(restored);assert.deepEqual(currentRoom(restored).enemies[0].supportSpawn,e.supportSpawn);
 for(const mutate of [v=>currentRoom(v).enemies[0].supportSummons=5,v=>currentRoom(v).enemies[0].attackTime=9,v=>delete currentRoom(v).enemies[0].supportSpawn,v=>currentRoom(v).supportEncounter.ascent.enemyId=99999]){const broken=structuredClone(s);mutate(broken);assert.throws(()=>encodeSave(broken));}
 e.supportSummons=1;r.enemies.push(child(e));assert.ok(parseSave(encodeSave(s)));const bad=structuredClone(s);currentRoom(bad).enemies[1].summonOwner=9999;assert.throws(()=>encodeSave(bad));
});
test('phase poses, detached effects and asset packs cover both casters and their minion without mutating gameplay',()=>{
 const {e,p,r}=combat('choirCantor');updateSupportCaster(e,p,r,.01,[]);assert.equal(supportPose(e).index,3);e.attackTime=.1;assert.equal(supportPose(e).index,4);e.attackPhase='supportRelease';assert.equal(supportPose(e).index,5);e.attackPhase='supportRecover';assert.equal(supportPose(e).index,6);e.attackPhase='supportCast';e.attackTime=.95;
 const before=JSON.stringify(r),calls=[],c=new Proxy({},{get:(t,k)=>k in t?t[k]:(...args)=>calls.push([k,...args]),set:(t,k,v)=>(t[k]=v,true)});drawSupportEffects(c,e,r,true);assert.ok(calls.some(c=>c[0]==='lineTo'));assert.equal(JSON.stringify(r),before);
 for(const type of [...supportTypes,'ossuaryMinion']){assert.ok(assetPlanFiles(portraitAssetPlan(type)).includes('ossuary-minion-atlas-v1.png'));const f=enemyDeathEffect({id:1,type,x:0,y:0,hp:0,max:10});assert.equal(f.bodyType,type);assert.equal(f.duration,type==='ossuaryMinion'?.45:.65);}
});
