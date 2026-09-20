import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom,bossDefeated,advanceClock} from './engine.js';
import {dropEssences,collectEssences,essences} from './essences.js';
import {relics,grantRelic,ownedRelics,relicStat,ultimateCooldown,movementSpeed} from './relics.js';
import {castBlink,castUltimate} from './abilities.js';
import {encodeSave,parseSave} from './storage.js';
import {stepRun,fireArrow} from './simulation.js';
import {takeDamage} from './survival.js';
import {elementalImpact,tickElements} from './elements.js';
import {chooseEvent} from './adventures.js';
import {drawLoot,claimTrialLoot,trialRelic,lootTable} from './loot.js';

test('essence drop thresholds double on descent with trial priority over elite',()=>{
 for(const [enemy,chance] of [[{},.005],[{elite:'volley'},.05],[{trialChampion:true,elite:'volley'},.1]])for(const key of [false,true]){
  const s={key},room={},e={type:'chaser',x:200,y:200,...enemy};let i=0;const threshold=chance*(key?2:1);
  dropEssences(s,room,e,()=>i++===0?threshold-.00001:0);assert.equal(room.essences.length,1);
  const other={};dropEssences(s,other,e,()=>threshold);assert.equal(other.essences.length,0);
 }
 const room={};dropEssences({key:true},room,{summoned:true},()=>0);assert.equal(room.essences,undefined);
});
test('bosses always drop one essence and rarely a second at their position',()=>{
 for(const key of [false,true])for(const roll of [.09,.15,.5]){const room={};let i=0;dropEssences({key},room,{type:'boss',x:400,y:200},()=>i++?0:roll);assert.equal(room.essences.length,1+Number(roll<(key?.2:.1)));assert.equal(room.essences[0].x,400);}
});
test('all five essences persist on the ground and are collected once, including health above ten',()=>{
 let s=newRun(2),r=currentRoom(s);s.player.max=s.player.hp=10;r.essences=essences.map(e=>({id:e.id,x:480,y:300}));
 s=parseSave(encodeSave(s));r=currentRoom(s);assert.equal(collectEssences(s,r).length,5);assert.equal(s.player.damage,20);assert.equal(s.player.max,11);assert.equal(s.player.hp,11);assert.equal(s.player.bonusMove,.05);assert.equal(s.player.bonusAttack,.05);assert.equal(ultimateCooldown(s.player),22.5);assert.equal(collectEssences(s,r).length,0);assert.doesNotThrow(()=>parseSave(encodeSave(s)));
});
test('essences cannot be collected remotely or through cover',()=>{
 const s=newRun(3),r=currentRoom(s);r.essences=[{id:'attack',x:500,y:300}];r.obstacles=[{x:488,y:275,w:5,h:50,type:'rock'}];assert.equal(collectEssences(s,r).length,0);r.obstacles=[];s.player.x=100;assert.equal(collectEssences(s,r).length,0);s.player.x=410;grantRelic(s.player,'magnet');assert.equal(collectEssences(s,r).length,1);
});
test('31 relics stack persistently, old single slot migrates and duplicates have no effect',()=>{
 const s=newRun(4);s.player.relic='boots';const loaded=parseSave(encodeSave(s));assert.deepEqual(loaded.player.relics,['boots']);assert.equal(loaded.player.relic,undefined);
 for(const r of relics)grantRelic(loaded.player,r.id);assert.equal(ownedRelics(loaded.player).length,31);const hp=loaded.player.max;assert.equal(grantRelic(loaded.player,'heart'),false);assert.equal(loaded.player.max,hp);assert.equal(relicStat(loaded.player,'move'),.18);assert.ok(movementSpeed(loaded.player)>174);assert.equal(parseSave(encodeSave(loaded)).player.relics.length,31);
});
test('relic attack speed and ultimate damage/cooldown affect actual casts',()=>{
 const s=newRun(5),r=currentRoom(s);s.player.power=5;grantRelic(s.player,'quiver');fireArrow(s,{x:700,y:300});assert.equal(s.attack,.65/1.15);
 grantRelic(s.player,'crown');grantRelic(s.player,'rain');s.player.ultimate=1;s.player.evolutions={ultimate:'burst'};r.enemies=[{id:0,x:500,y:300,hp:500,max:500}];assert.ok(castUltimate(s));assert.equal(r.enemies[0].hp,419);assert.equal(s.skill,20);
});
test('aura shield absorbs one hit, respects invulnerability, pause and recharge, independently of armor',()=>{
 const s=newRun(6);s.player.aura=3;s.player.armor=2;assert.equal(takeDamage(s,20),'blocked');assert.equal(s.auraShield,60);assert.equal(s.shield,undefined);assert.equal(takeDamage(s,20),'ignored');s.invulnerable=0;assert.equal(takeDamage(s,20),'blocked');s.invulnerable=0;assert.equal(takeDamage(s,10),'hurt');advanceClock(s,60,true);assert.equal(s.auraShield,60);advanceClock(s,60,false);assert.equal(takeDamage(s,20),'blocked');assert.equal(s.player.hp,4);assert.equal(parseSave(encodeSave(s)).auraShield,60);
});
test('blink travels 175 units, respects walls, cooldown and existing longer invulnerability',()=>{
 const s=newRun(7);s.invulnerable=1;assert.ok(castBlink(s,{x:1,y:0}));assert.equal(s.player.x,655);assert.equal(s.dodge,10);assert.equal(s.invulnerable,1);assert.equal(castBlink(s,{x:1,y:0}),false);s.dodge=0;currentRoom(s).obstacles=[{x:700,y:200,w:20,h:200,type:'rock'}];assert.ok(castBlink(s,{x:1,y:0}));assert.ok(s.player.x<700);
});
test('fire explosion hits full radius instantly and burn pulses every half second across saves',()=>{
 let s=newRun(8),r=currentRoom(s);s.attack=999;s.player.fire=3;r.enemies=[{id:0,type:'archer',x:700,y:300,hp:1000,max:1000,cd:999,balanceVersion:1},{id:1,type:'archer',x:785,y:300,hp:1000,max:1000,cd:999,balanceVersion:1}];const fx=elementalImpact(s.player,r.enemies[0],r.enemies,r);assert.ok(fx[0].instant);assert.ok(r.enemies[1].hp<1000);const hp=r.enemies[0].hp;tickElements(r,.25);assert.equal(r.enemies[0].hp,hp);s=parseSave(encodeSave(s));r=currentRoom(s);tickElements(r,.25);assert.equal(r.enemies[0].hp,hp-4.5);
});
test('trial relic has increased weight and a single saved payout',()=>{
 assert.equal(trialRelic.weight,4);const s=newRun(9),r=currentRoom(s);const reward=drawLoot(s.player,()=>.99999,true,[],true);assert.equal(reward.id,'relic');r.trialState='reward';r.trialOffers=[reward,{id:'attack3'},{id:'potion'}];const loaded=parseSave(encodeSave(s));assert.ok(claimTrialLoot(loaded,0));assert.equal(ownedRelics(loaded.player).length,1);assert.equal(claimTrialLoot(loaded,0),false);
});
test('trial rosters vary across seeds and higher floors have clearly larger health pools',()=>{
 const roster=new Set(),health=[0,0];for(let seed=0;seed<50;seed++)for(const [index,floor] of [2,4].entries()){const s=newRun(seed);s.floor=floor;s.room=s.floors[floor].findIndex(r=>r.type==='event');chooseEvent(s,'trial');const enemies=currentRoom(s).enemies;roster.add(enemies.map(e=>e.type).sort().join(','));health[index]+=enemies.reduce((n,e)=>n+e.max,0);}assert.ok(roster.size>=8);assert.ok(health[1]>health[0]*1.35);
});
test('slime encounter drops exactly once after all split stages and final boss offers a relic',()=>{
 const s=newRun(10);s.floor=5;s.room=s.floors[5].findIndex(r=>r.type==='boss');s.attack=999;const r=currentRoom(s);for(let stage=0;stage<3;stage++){r.enemies.forEach(e=>e.hp=0);stepRun(s,.01);if(stage<2)assert.equal(r.essences?.length||0,0);}assert.equal(s.key,false);assert.ok(r.essences.length>=1&&r.essences.length<=2);assert.equal(r.relicOffers.length,3);const count=r.essences.length;stepRun(s,.01);assert.equal(r.essences.length,count);
});
test('new save fields reject duplicate relics, unknown essences and invalid shield clocks',()=>{
 const s=newRun(11);s.player.relics=['boots','boots'];assert.throws(()=>encodeSave(s));s.player.relics=[];currentRoom(s).essences=[{id:'bad',x:480,y:300}];assert.throws(()=>encodeSave(s));currentRoom(s).essences=[];s.auraShield=-1;assert.throws(()=>encodeSave(s));
});
test('boss health migration preserves remaining health ratio and only applies once',()=>{
 const s=newRun(12),e=s.floors[1].find(r=>r.type==='boss').enemies[0];delete e.bossPowerVersion;e.max=825;e.hp=330;const loaded=parseSave(encodeSave(s)),boss=loaded.floors[1].find(r=>r.type==='boss').enemies[0];assert.equal(boss.max,1155);assert.equal(boss.hp,462);assert.deepEqual(parseSave(encodeSave(loaded)).floors,loaded.floors);
});
