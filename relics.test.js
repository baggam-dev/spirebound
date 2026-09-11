import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom,bossDefeated} from './engine.js';
import {offerRelics,claimRelic,directRelicFactor,movementSpeed,dodgeCooldown} from './relics.js';
import {parseSave,encodeSave} from './storage.js';
import {hitEnemy} from './progression.js';
import {stepRun,ensureMetrics} from './simulation.js';
import {shieldCooldown} from './survival.js';
import {castUltimate} from './abilities.js';
import {observeRoom,recordHit} from './expedition.js';
function boss(){const s=newRun(201);s.floor=1;s.room=s.floors[1].findIndex(r=>r.type==='boss');currentRoom(s).enemies=[];currentRoom(s).seen=true;return s;}
test('middle bosses offer deterministic eligible relics once; final boss still gives the key',()=>{
 const a=boss(),b=boss();bossDefeated(a);bossDefeated(b);assert.deepEqual(currentRoom(a).relicOffers,currentRoom(b).relicOffers);assert.deepEqual(new Set(currentRoom(a).relicOffers),new Set(['lens','boots']));
 const before=currentRoom(a).relicOffers.slice();a.player.fire=3;offerRelics(a,currentRoom(a));assert.deepEqual(currentRoom(a).relicOffers,before);
 a.floor=5;a.room=a.floors[5].findIndex(r=>r.type==='boss');currentRoom(a).enemies=[];assert.equal(bossDefeated(a),'key');assert.equal(currentRoom(a).relicOffers,undefined);
});
test('one relic slot replaces rather than stacks and cannot be reclaimed after save',()=>{
 let s=boss();bossDefeated(s);assert.equal(claimRelic(s,'rain'),false);assert.ok(claimRelic(s,'boots'));assert.equal(s.player.speed,174);s=parseSave(encodeSave(s));assert.equal(claimRelic(s,'lens'),false);
 s.floor=3;s.room=s.floors[3].findIndex(r=>r.type==='boss');currentRoom(s).enemies=[];bossDefeated(s);assert.ok(!currentRoom(s).relicOffers.includes('boots'));assert.ok(claimRelic(s,'lens'));assert.equal(s.player.relic,'lens');assert.equal(movementSpeed(s.player),174);
});
test('skipping relics preserves the equipped item and claims the cache without changing cooldowns',()=>{
 const s=boss();s.player.relic='boots';s.dodge=12;s.skill=9;bossDefeated(s);assert.ok(claimRelic(s,'skip'));assert.equal(s.player.relic,'boots');assert.equal(s.dodge,12);assert.equal(s.skill,9);assert.equal(claimRelic(s,'lens'),false);
});
test('relic tradeoffs use exact distance boundaries, shield limits and cooldowns',()=>{
 const p={relic:'lens',x:0,y:0};assert.equal(directRelicFactor(p,{x:139,y:0}),.8);assert.equal(directRelicFactor(p,{x:140,y:0}),1);assert.equal(directRelicFactor(p,{x:280,y:0}),1.2);
 assert.equal(shieldCooldown({armor:2,relic:'iron'}),27);assert.equal(shieldCooldown({armor:99,relic:'iron'}),12);assert.equal(dodgeCooldown({relic:'iron'}),25);assert.equal(dodgeCooldown({}),20);
 const s=newRun();s.player.split=4;s.player.chain=1;s.player.relic='rain';assert.ok(castUltimate(s));assert.equal(s.skill,20);
});
test('boots and stride bonuses are symmetric and diagonal motion is normalized',()=>{
 const base=newRun(9);base.player.relic='boots';base.player.evolutions={haste:'stride'};const samples=[];
 for(const input of [{x:1,y:0},{x:0,y:1},{x:1,y:1}]){const s=structuredClone(base);stepRun(s,.1,input);samples.push(Math.hypot(s.player.x-base.player.x,s.player.y-base.player.y));}
 for(const d of samples)assert.ok(Math.abs(d-174*1.08*1.12*.1)<1e-9);
});
test('ember relic strengthens burn at the cost of direct arrow damage',()=>{
 const p={damage:20,fire:2,frost:2,relic:'ember'},e={hp:100,x:20,y:20};hitEnemy(p,e,[e]);assert.equal(e.hp,66.53);assert.equal(e.burnStacks[0].dps,4.25);assert.equal(e.slow,2);
});
test('journal observes only current enemies and retains discovered elite traits',()=>{
 const s=newRun(8);assert.equal(s.bestiary,undefined);observeRoom(s,{enemies:[{type:'archer',elite:'volley'}]});observeRoom(s,{enemies:[{type:'archer',elite:'volley'}]});assert.deepEqual(Object.keys(s.bestiary),['archer']);assert.deepEqual(s.bestiary.archer.traits,['volley']);assert.equal(s.bestiary.slime,undefined);
});
test('successful hits record source and floor totals; ignored hits are absent and history is bounded',()=>{
 const s=newRun(6);ensureMetrics(s);recordHit(s,'추격자 접촉',1,false);recordHit(s,'막은 탄환',0,true);recordHit(s,'무적',0,false);assert.equal(s.combatLog.length,2);assert.equal(s.lastHit.source,'추격자 접촉');assert.equal(s.metrics.floorDamage[0],1);
 for(let i=0;i<15;i++){s.elapsed=i;recordHit(s,'테스트',1,false);}assert.equal(s.combatLog.length,10);assert.equal(s.combatLog[0].time,5);
 const loaded=parseSave(encodeSave(s));assert.deepEqual(loaded.combatLog,s.combatLog);
});
test('lethal projectile records its actual source before death and does not count invulnerable hits',()=>{
 const s=newRun(3);s.player.hp=1;s.projectiles=[{x:470,y:300,vx:300,vy:0,life:2,enemy:true,hit:[],source:'시험 사수 탄환'}];assert.ok(stepRun(s,.05).events.includes('dead'));assert.equal(s.lastHit.source,'시험 사수 탄환');assert.equal(s.lastHit.amount,1);
 const t=newRun(3);t.invulnerable=1;t.projectiles=[{x:470,y:300,vx:300,vy:0,life:2,enemy:true,hit:[],source:'무시할 탄환'}];stepRun(t,.05);assert.equal(t.combatLog,undefined);
});
test('new save fields reject invalid relics, codex keys and damage history',()=>{
 const s=boss();s.player.relic='broken';assert.throws(()=>encodeSave(s));delete s.player.relic;s.bestiary={constructor:{kills:1,traits:[]}};assert.throws(()=>encodeSave(s));delete s.bestiary;s.combatLog=[{source:'bad',time:0,floor:9,room:0,amount:1,blocked:false}];assert.throws(()=>encodeSave(s));
});
test('damage diagnostics include capped burn, field and instant ultimate damage',()=>{
 const s=newRun(7),r=currentRoom(s);ensureMetrics(s);s.attack=999;r.enemies=[{id:0,type:'archer',x:600,y:300,hp:50,max:50,cd:999,burn:2,burnDamage:5}];stepRun(s,.1);assert.equal(s.metrics.damageDealt,.5);
 s.player.split=4;s.player.chain=1;assert.ok(castUltimate(s));assert.equal(s.metrics.damageDealt,50);
 r.enemies=[{id:1,type:'archer',x:500,y:300,hp:500,max:500,cd:999}];s.player.evolutions={ultimate:'field'};s.skill=0;castUltimate(s);stepRun(s,.1);assert.equal(s.metrics.damageDealt,54);
});

