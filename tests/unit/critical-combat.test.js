import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom} from '../../src/game/engine.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
import {weaponSnapshot} from '../../src/combat/weapon-projectiles.js';
import {criticalStats,nextCriticalRandom,createCriticalSnapshot,createDamagePacket,applyPlayerDamage,drainDamageResults,validCriticalSnapshot} from '../../src/combat/critical.js';
const enemy=()=>({id:0,type:'chaser',x:600,y:300,hp:1000,max:1000,cd:1,balanceVersion:1});
function fixture(){const s=newRun(42),e=enemy();currentRoom(s).enemies=[e];s.player.critChance=.5;s.critical.randomState=0;return {s,e};}

test('new runs have bounded critical stats and a separate seeded stream',()=>{
 const a=newRun(42),b=newRun(42),random=a.randomState;assert.deepEqual(criticalStats(a.player),{chance:.05,multiplier:1.5});
 assert.deepEqual(criticalStats({critChance:1,critMultiplier:10}),{chance:.5,multiplier:2.5});
 assert.equal(nextCriticalRandom(a),nextCriticalRandom(b));assert.equal(a.randomState,random);
 a.player.critChance=0;const before=a.critical.randomState;assert.equal(createCriticalSnapshot(a).critical,false);assert.equal(a.critical.randomState,before);
});
test('one target packet shares the critical result across physical and elemental damage',()=>{
 const {s,e}=fixture(),packet=createDamagePacket(),random=s.randomState;
 const first=applyPlayerDamage(s,e,100,{source:'arrow',packet}),state=s.critical.randomState;
 const second=applyPlayerDamage(s,e,20,{source:'element',packet});
 assert.equal(first.damage,150);assert.equal(second.damage,30);assert.equal(second.newHit,false);assert.equal(s.critical.randomState,state);assert.equal(s.randomState,random);
 assert.equal(e.hp,820);assert.equal(s.critical.hits,1);assert.equal(s.critical.criticalHits,1);assert.equal(s.critical.criticalDamage,180);
 assert.equal(drainDamageResults(s).length,2);assert.deepEqual(drainDamageResults(s),[]);
});
test('a shield or zero damage cannot roll a critical or count a hit',()=>{
 const {s,e}=fixture();Object.assign(e,{variant:'demon',part:'foot',demonShield:true});const before=s.critical.randomState;
 assert.equal(applyPlayerDamage(s,e,0).applied,false);assert.equal(e.demonShield,true);
 assert.equal(applyPlayerDamage(s,e,100).applied,false);assert.equal(e.hp,1000);assert.equal(e.demonShield,false);assert.equal(s.critical.randomState,before);assert.equal(s.critical.hits,0);
});
test('damage snapshots survive DoT reload without rerolling or recounting the same application',()=>{
 let {s,e}=fixture();const snapshot=createCriticalSnapshot(s);assert.equal(snapshot.critical,true);e.poisonRadius=42;e.poisonLevel=1;e.poisonStacks=[{time:2,dps:10,criticalSnapshot:snapshot}];
 applyPlayerDamage(s,e,2,{source:'poison',snapshot});const random=s.critical.randomState;s=parseSave(encodeSave(s));e=currentRoom(s).enemies[0];
 const result=applyPlayerDamage(s,e,2,{source:'poison',snapshot:e.poisonStacks[0].criticalSnapshot});
 assert.equal(result.damage,3);assert.equal(result.newHit,false);assert.equal(s.critical.criticalHits,1);assert.equal(s.critical.criticalDamage,6);assert.equal(s.critical.randomState,random);assert.equal(e.hp,994);
});
test('mixed continuous components apply defense once and attribute only the critical share',()=>{
 const {s,e}=fixture();const critical=createCriticalSnapshot(s);s.player.critChance=0;const plain=createCriticalSnapshot(s);e.protected=true;
 const result=applyPlayerDamage(s,e,0,{components:[{amount:20,snapshot:critical},{amount:20,snapshot:plain}]});
 assert.equal(result.damage,25);assert.equal(result.criticalDamage,15);assert.equal(e.hp,975);assert.equal(s.critical.hits,2);assert.equal(s.critical.criticalHits,1);
});
test('overkill critical accounting uses actual remaining HP',()=>{
 const {s,e}=fixture();e.hp=5;const result=applyPlayerDamage(s,e,100);assert.equal(result.damage,5);assert.equal(result.criticalDamage,5);assert.equal(s.critical.damage,5);assert.equal(s.critical.criticalDamage,5);
 assert.equal(applyPlayerDamage(s,e,100).applied,false);assert.equal(s.critical.hits,1);
});
test('save reload reproduces the next roll and migrates legacy saves without resetting existing critical state',()=>{
 const {s}=fixture(),restored=parseSave(encodeSave(s));assert.equal(createCriticalSnapshot(s).critical,createCriticalSnapshot(restored).critical);assert.equal(s.critical.randomState,restored.critical.randomState);
 delete s.critical;delete s.player.critChance;delete s.player.critMultiplier;
 const legacy=parseSave(encodeSave(s));assert.deepEqual(criticalStats(legacy.player),{chance:.05,multiplier:1.5});const state=legacy.critical.randomState;
 assert.equal(parseSave(encodeSave(legacy)).critical.randomState,state);
});
test('weapon snapshots retain cast-time critical stats and invalid saved critical data is rejected',()=>{
 const {s,e}=fixture(),build=weaponSnapshot(s.player);s.player.critChance=0;s.player.critMultiplier=1;
 assert.equal(build.critChance,.5);assert.equal(build.critMultiplier,1.5);
 s.critical.randomState=-1;assert.throws(()=>encodeSave(s));s.critical.randomState=0;
 s.player.critChance=NaN;assert.throws(()=>encodeSave(s));s.player.critChance=0;
 e.poisonStacks=[{time:2,dps:10,criticalSnapshot:{version:1,id:0,critical:false,multiplier:2,countedTargets:[]}}];assert.throws(()=>encodeSave(s));assert.equal(validCriticalSnapshot(e.poisonStacks[0].criticalSnapshot),false);
});
test('invalid damage components do not mutate HP, consume a shield or advance RNG',()=>{
 const {s,e}=fixture();e.variant='demon';e.part='foot';e.demonShield=true;const before=JSON.stringify({s,e});
 assert.throws(()=>applyPlayerDamage(s,e,Infinity));assert.throws(()=>applyPlayerDamage(s,e,1,{snapshot:{}}));assert.equal(JSON.stringify({s,e}),before);
});

test('the default five-percent stream stays deterministic across a long sample without touching world RNG',()=>{
 const {s,e}=fixture();s.player.critChance=.05;e.hp=e.max=100000;const random=s.randomState;
 for(let i=0;i<5000;i++)applyPlayerDamage(s,e,1);
 assert.equal(s.critical.hits,5000);assert.ok(s.critical.criticalHits>=175&&s.critical.criticalHits<=325);assert.equal(s.randomState,random);
});
test('legacy weapon builds receive default critical stats once instead of borrowing later player upgrades',()=>{
 const {s}=fixture();const build=weaponSnapshot(s.player);delete build.critChance;delete build.critMultiplier;delete s.critical;
 currentRoom(s).turrets=[{x:480,y:300,time:10,clock:0,aim:0,build}];
 const loaded=parseSave(encodeSave(s));assert.equal(currentRoom(loaded).turrets[0].build.critChance,.05);assert.equal(currentRoom(loaded).turrets[0].build.critMultiplier,1.5);
 loaded.player.critChance=.5;assert.equal(currentRoom(loaded).turrets[0].build.critChance,.05);
});
