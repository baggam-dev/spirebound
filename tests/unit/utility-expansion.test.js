import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom,advanceClock} from '../../src/game/engine.js';
import {stepRun} from '../../src/game/simulation.js';
import {castUtility,canCastUtility} from '../../src/combat/utility.js';
import {tickUtilityCast,consumeGaleProjectile} from '../../src/combat/utility-expansion.js';
import {movementSlowFactor} from '../../src/combat/frost.js';
import {movementSpeed,grantRelic} from '../../src/progression/relics.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';

const enemy=(id,x,y,extra={})=>({id,type:'archer',x,y,hp:500,max:500,cd:30,tier:0,...extra});
function setup(id){const s=newRun(85);s.player.level=6;s.player.utility=id;s.player.critChance=0;currentRoom(s).obstacles=[];currentRoom(s).enemies=[];s.attack=99;s.entryGrace=0;return s;}
test('frost wave uses one normal damage hit per eligible target and keeps existing frost duration and strength',()=>{
 const s=setup('frostWave'),r=currentRoom(s),p=s.player;r.enemies=[enemy(0,p.x+50,p.y,{slow:4,slowFactor:.4}),enemy(1,p.x+70,p.y,{type:'boss'}),enemy(2,p.x+200,p.y),enemy(3,p.x+20,p.y,{phase:'air'})];
 const random=s.randomState;assert.equal(castUtility(s),'frostWave');tickUtilityCast(s,r,0,[]);
 assert.equal(r.enemies[0].hp,500-17);assert.equal(r.enemies[0].slow,4);assert.equal(movementSlowFactor(r.enemies[0]),.4);
 assert.equal(r.enemies[0].utilityFrostTime,2);assert.equal(movementSlowFactor(r.enemies[1]),.8);assert.equal(r.enemies[1].utilityFrostTime,1);
 assert.equal(r.enemies[2].hp,500);assert.equal(r.enemies[3].hp,500);assert.equal(s.randomState,random);assert.equal(s.utilityCast,undefined);
});
test('sigil has no cooldown cost without a target; its saved fixed point and countdown survive reload without replay',()=>{
 let s=setup('thunderSigil');assert.equal(canCastUtility(s),false);assert.equal(castUtility(s),false);assert.equal(s.utilityCooldown,0);
 currentRoom(s).enemies=[enemy(0,s.player.x+60,s.player.y)];grantRelic(s.player,'ritualKnot');assert.equal(castUtility(s),'thunderSigil');assert.equal(s.utilityCooldown,28*.85);
 const x=s.utilityCast.x;tickUtilityCast(s,currentRoom(s),.3,[]);s=parseSave(encodeSave(s));assert.equal(s.utilityCast.x,x);
 currentRoom(s).enemies[0].x=x+140;const hp=currentRoom(s).enemies[0].hp;tickUtilityCast(s,currentRoom(s),.36,[]);assert.equal(currentRoom(s).enemies[0].hp,hp);assert.equal(s.utilityCast,undefined);
});
test('a pending utility cast cannot hit or follow the player into a different room',()=>{
 const s=setup('thunderSigil');currentRoom(s).enemies=[enemy(0,s.player.x+60,s.player.y)];castUtility(s);s.room=1;const snapshot=JSON.stringify(currentRoom(s).enemies);tickUtilityCast(s,currentRoom(s),1,[]);assert.equal(s.utilityCast,undefined);assert.equal(JSON.stringify(currentRoom(s).enemies),snapshot);
});
test('gale charges stop at two; special projectiles and allies cannot consume them, movement survives exhausted charges',()=>{
 const s=setup('galeVeil'),base=movementSpeed(s.player);castUtility(s);assert.equal(movementSpeed(s.player),base*1.35);
 for(const b of [{enemy:false},{enemy:true,ricochet:true},{enemy:true,beam:true},{enemy:true,unblockable:true}])assert.equal(consumeGaleProjectile(s,{...b,life:1},{x:0,y:0},[]),false);
 for(let i=0;i<2;i++){const b={enemy:true,life:1};assert.equal(consumeGaleProjectile(s,b,{x:0,y:0},[]),true);assert.equal(b.life,0);}
 assert.equal(consumeGaleProjectile(s,{enemy:true,life:1},{x:0,y:0},[]),false);assert.equal(movementSpeed(s.player),base*1.35);
 const before=s.player.galeTime;advanceClock(s,1,true);assert.equal(s.player.galeTime,before);advanceClock(s,3,false);assert.equal(movementSpeed(s.player),base);assert.equal(s.player.galeCharges,0);
});
test('actual simulation intercepts only two incoming ordinary enemy shots and preserves the third hit',()=>{
 const s=setup('galeVeil'),p=s.player;castUtility(s);s.projectiles=Array.from({length:3},()=>({x:p.x-35,y:p.y,vx:500,vy:0,life:1,hit:[],enemy:true,damage:9}));
 const result=stepRun(s,.05);assert.equal(result.effects.filter(f=>f.utilityFx==='galeBreak').length,2);assert.equal(p.galeCharges,0);assert.ok(p.hp<5);
});
test('save validation rejects forged casts and out-of-range charge counts while accepting legacy absent fields',()=>{
 const s=setup('galeVeil');assert.ok(parseSave(encodeSave(s)));castUtility(s);assert.ok(parseSave(encodeSave(s)));s.player.galeCharges=3;assert.throws(()=>encodeSave(s));
 const t=setup('thunderSigil');currentRoom(t).enemies=[enemy(0,t.player.x+60,t.player.y)];castUtility(t);t.utilityCast.criticalProfile.critChance=1;assert.throws(()=>encodeSave(t));t.utilityCast.criticalProfile.critChance=0;t.utilityCast.room++;assert.throws(()=>encodeSave(t));
});
