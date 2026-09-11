import test from 'node:test';
import assert from 'node:assert/strict';
import {elementalImpact,tickElements} from './elements.js';
import {newRun,currentRoom,generateFloor} from './engine.js';
import {fireArrow,stepRun,enterRoom} from './simulation.js';
import {encodeSave,parseSave} from './storage.js';
import {ultimateUnlocked} from './abilities.js';
import {chooseEvent} from './adventures.js';
import {attackProfile} from './balance.js';
import {seededRandom} from './random.js';
const enemy=(x=500,y=300,hp=1000,id=0)=>({id,type:'archer',x,y,hp,max:hp,cd:999,balanceVersion:1});
test('all arrow counts retain exactly one aimed primary and alternate unmatched sides',()=>{
 for(let split=0;split<=4;split++){const s=newRun(1);s.player.split=split;for(let volley=0;volley<2;volley++){s.projectiles=[];fireArrow(s,{x:800,y:300});assert.equal(s.projectiles.length,split+1);const primary=s.projectiles.filter(b=>b.damageScale===1);assert.equal(primary.length,1);assert.equal(primary[0].vy,0);assert.equal(s.projectiles.filter(b=>b.elemental).length,split+1);if(split)assert.equal(Math.sign(s.projectiles[1].vy),volley===0?1:-1);}}
});
test('fire levels grow splash damage and radius; burn starts at two and floor at three',()=>{
 let previous=0;for(let fire=1;fire<=3;fire++){const a=enemy(),edge=enemy(500+20+7.5*fire,300,1000,1),outside=enemy(edge.x+1,300,1000,2),r={enemies:[a,edge,outside]};elementalImpact({damage:20,fire},a,r.enemies,r);assert.ok(1000-a.hp>previous);previous=1000-a.hp;assert.equal(edge.hp,a.hp);assert.equal(outside.hp,1000);assert.equal(a.burnStacks?.length||0,fire>=2?1:0);assert.equal(r.fireZones?.length||0,0);}
});
test('burn stacks expire individually and overlapping fire zones do not multiply damage',()=>{
 const a=enemy(),r={enemies:[a]};elementalImpact({damage:20,fire:3},a,r.enemies,r);elementalImpact({damage:20,fire:3},a,r.enemies,r);r.fireZones=[{x:500,y:300,r:42.5,time:1.5,dps:10.2},{x:500,y:300,r:42.5,time:1.5,dps:10.2}];const before=a.hp;tickElements(r,3);assert.ok(Math.abs(before-a.hp-(2*4.76*2+10.2*1.5))<1e-9);assert.equal(a.burnStacks.length,0);assert.equal(r.fireZones.length,0);const hp=a.hp;tickElements(r,1);assert.equal(a.hp,hp);
});
test('poison gains damage and gas radius by level; gas requires two live stacks',()=>{
 for(let poison=1;poison<=3;poison++){const a=enemy(),b=enemy(530,300,1000,1),r={enemies:[a,b]};elementalImpact({poison},a,r.enemies,r);tickElements(r,.5);assert.equal(b.hp,1000);elementalImpact({poison},a,r.enemies,r);const before=a.hp;tickElements(r,.5);assert.equal(before-a.hp,(2+2*poison));assert.equal(1000-b.hp,(2+2*poison)*.5);assert.equal(a.poisonRadius,30+12*poison);tickElements(r,3);assert.equal(a.poisonStacks.length,0);const hp=b.hp;tickElements(r,1);assert.equal(b.hp,hp);}
});
test('poison stack cap is bounded and gas only lasts until second latest stack expires',()=>{
 const a=enemy(),b=enemy(530,300,1000,1),r={enemies:[a,b]};for(let i=0;i<12;i++)elementalImpact({poison:1},a,r.enemies,r);assert.equal(a.poisonStacks.length,8);a.poisonStacks=[{time:.2,dps:4},{time:2,dps:4}];tickElements(r,1);assert.ok(Math.abs(b.hp-999.2)<1e-9);assert.equal(a.poisonStacks.length,1);
});
test('max poison corpse explosions chain once, and direct kills do not trigger them',()=>{
 const a=enemy(500,300,1),b=enemy(550,300,20,1),c=enemy(600,300,100,2),r={enemies:[a,b,c]};elementalImpact({poison:3},a,r.enemies,r);tickElements(r,.2,3);assert.ok(a.corpseExploded);assert.ok(b.corpseExploded);assert.equal(c.hp,76);tickElements(r,.2,3);assert.equal(c.hp,76);
 const d=enemy(500,300,1),e=enemy(510,300,100,1),q={enemies:[d,e]};elementalImpact({poison:3},d,q.enemies,q);d.hp=0;tickElements(q,.1,3);assert.equal(e.hp,100);assert.equal(d.corpseExploded,undefined);
});
test('each arrow activates elements only on first contact; explicitly spent procs stay spent',()=>{
 const s=newRun(4),r=currentRoom(s);s.player.fire=3;s.player.pierce=3;s.player.split=4;s.attack=999;r.obstacles=[];r.enemies=[enemy(550,300,1000),enemy(710,300,1000,1)];fireArrow(s,{x:800,y:300});s.projectiles=s.projectiles.filter(b=>b.damageScale===1);s.attack=999;stepRun(s,.7);assert.equal(r.fireZones.length,0);assert.equal(r.enemies[1].burnStacks,undefined);assert.equal(r.enemies[1].hp,980);
 const q=newRun(4),t=currentRoom(q);q.player.fire=3;q.attack=999;t.enemies=[enemy(550)];q.projectiles=[{x:500,y:300,vx:420,vy:0,enemy:false,elemental:false,damageScale:.45,life:3,pierce:0,hit:[]}];stepRun(q,.2);assert.equal(t.fireZones.length,0);assert.equal(t.enemies[0].burnStacks,undefined);
});
test('element timers, fields and volley direction resume deterministically and reject malformed stacks',()=>{
 let s=newRun(2),r=currentRoom(s);r.enemies=[enemy()];s.player.fire=3;s.player.poison=3;s.attack=999;elementalImpact(s.player,r.enemies[0],r.enemies,r);elementalImpact(s.player,r.enemies[0],r.enemies,r);s.volleySide=-1;let copy=parseSave(encodeSave(s));for(let i=0;i<100;i++){stepRun(s,.01);stepRun(copy,.01);}assert.deepEqual(JSON.parse(JSON.stringify(copy)),JSON.parse(JSON.stringify(s)));r.enemies[0].poisonStacks[0].time=-1;assert.throws(()=>encodeSave(s));
});
test('legacy fire investments, evolution and pending offers become poison exactly once',()=>{
 const s=newRun(8);delete s.skillSystemVersion;s.generationVersion=12;delete s.player.poison;s.player.fire=3;s.player.frost=2;s.player.evolutions={fire:'flare'};s.choices=['fire','haste','split'];const map=JSON.stringify(s.floors);const migrated=parseSave(encodeSave(s));assert.equal(migrated.player.fire,0);assert.equal(migrated.player.poison,3);assert.equal(migrated.player.evolutions.poison,'flare');assert.equal(migrated.choices,null);assert.ok(ultimateUnlocked(migrated.player));assert.equal(JSON.stringify(migrated.floors),map);migrated.player.fire=1;assert.equal(parseSave(encodeSave(migrated)).player.fire,1);
});
test('new elite density rises from third to sixth floor across seeded populations',()=>{
 const totals=[];for(let floor=2;floor<6;floor++){let elites=0,enemies=0;for(let seed=0;seed<150;seed++)for(const r of generateFloor(floor,seededRandom(seed)))if(r.type==='normal'){elites+=r.enemies.filter(e=>e.elite).length;enemies+=r.enemies.length;}totals.push(elites/enemies);}for(let i=1;i<totals.length;i++)assert.ok(totals[i]>totals[i-1],JSON.stringify(totals));
});
test('trial uses three durable purple champions with stronger attack profiles',()=>{
 const s=newRun(3);s.floor=2;s.room=s.floors[2].findIndex(r=>r.type==='event');assert.ok(chooseEvent(s,'trial'));const r=currentRoom(s);assert.equal(r.enemies.length,3);for(const e of r.enemies){assert.ok(e.trialChampion);const a=attackProfile(e),b=attackProfile({...e,trialChampion:false});assert.ok(a.speed>b.speed&&a.count>b.count&&a.recovery<b.recovery);assert.ok(e.max>=100);}const loaded=parseSave(encodeSave(s));assert.ok(currentRoom(loaded).enemies.every(e=>e.trialChampion));r.fireZones=[{x:500,y:300,r:80,time:1,dps:12}];enterRoom(s);assert.equal(r.fireZones.length,0);
});
