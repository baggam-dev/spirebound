import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom} from '../../src/game/engine.js';
import {fireArrow,stepRun} from '../../src/game/simulation.js';
import {castUltimate,tickRain} from '../../src/combat/abilities.js';
import {tickPassives} from '../../src/progression/passives.js';
import {hitEnemy} from '../../src/progression/progression.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
import {turretEndings} from '../../src/combat/weapon-projectiles.js';
import {updatePoisonEnemy,updateHazards} from '../../src/combat/poison.js';
const foe=(id=0,x=650,y=300)=>({id,type:'chaser',x,y,hp:10000,max:10000,cd:99,balanceVersion:1});
function setup(){const s=newRun(42),r=currentRoom(s);r.obstacles=[];r.enemies=[foe()];s.attack=99;s.entryGrace=99;s.player.damage=20;return s;}
test('seeker is an independent normal 100% arrow; split arrows retain elements',()=>{
 const s=setup();Object.assign(s.player,{fire:3,mainSkill:'fire',homing:1,split:2,repeat:1});fireArrow(s,currentRoom(s).enemies[0]);assert.equal(s.projectiles.length,4);assert.ok(s.projectiles.every(b=>b.element==='fire'&&!b.homing));s.projectiles=[];
 tickPassives(s,1.49);assert.equal(s.projectiles.length,0);tickPassives(s,.01);assert.equal(s.projectiles.length,1);const b=s.projectiles[0];assert.ok(b.seeker&&b.homing);assert.equal(b.weapon.fire,0);assert.equal(b.weapon.split,0);const e=foe();hitEnemy(b.weapon,e,[e],[],1,false);assert.equal(e.hp,9980);assert.equal(e.burnStacks,undefined);assert.doesNotThrow(()=>parseSave(encodeSave(s)));
});
test('turret snapshots elemental volleys and seekers without duplicating fairies',()=>{
 for(const kind of ['fire','frost','poison','chain']){let s=setup();Object.assign(s.player,{[kind]:3,mainSkill:kind,split:2,pierce:2,repeat:1,homing:1,ultimate:1,evolutions:{ultimate:'turret'},relics:['sunFairy']});castUltimate(s);s.player.damage=999;s.player[kind]=1;s=parseSave(encodeSave(s));tickPassives(s,.01);const shots=s.projectiles.filter(b=>b.turretShot);assert.equal(shots.length,4);assert.ok(shots.every(b=>b.weapon.damage===20&&b.weapon[kind]===3&&b.element===kind));assert.equal(shots.at(-1).delay,.16);assert.equal(currentRoom(s).turrets[0].clock,.6);assert.ok(shots.every(b=>b.passive===undefined));tickPassives(s,1.49);assert.equal(s.projectiles.filter(b=>b.seeker&&b.turretShot).length,1);assert.equal(s.projectiles.filter(b=>b.passive==='sunFairy').length,1);assert.doesNotThrow(()=>parseSave(encodeSave(s)));}
});
test('turret damage is frozen and delayed arrow stays at installation after player moves',()=>{
 const s=setup();s.player.ultimate=1;s.player.repeat=1;s.player.evolutions={ultimate:'turret'};castUltimate(s);tickPassives(s,.01);s.player.x=200;s.player.damage=999;const delayed=s.projectiles.at(-1);stepRun(s,.2);assert.ok(delayed.x>480);for(let i=0;i<15;i++)stepRun(s,1/60);assert.ok(currentRoom(s).enemies[0].hp<10000);assert.ok(currentRoom(s).enemies[0].hp>9900);assert.ok(s.metrics.ultimateDamage>0);
});
test('build corruption rejected and legacy turret snapshots once',()=>{
 const s=setup();currentRoom(s).turrets=[{x:480,y:300,time:19,clock:0,aim:0}];tickPassives(s,.01);assert.equal(currentRoom(s).turrets[0].build.damage,20);const copy=parseSave(encodeSave(s));currentRoom(copy).turrets[0].build.fire=99;assert.throws(()=>encodeSave(copy));s.projectiles[0].weapon.damage=-1;assert.throws(()=>encodeSave(s));
});
test('rain is 50 per pulse; retirement has no attacks',()=>{
 const s=setup();s.player.ultimate=1;s.player.evolutions={ultimate:'burst'};castUltimate(s);tickRain(s,1.3);assert.equal(currentRoom(s).enemies[0].hp,9850);s.skill=0;s.player.evolutions.ultimate='turret';castUltimate(s);s.skill=0;castUltimate(s);s.skill=0;castUltimate(s);assert.equal(turretEndings(currentRoom(s)).length,1);tickPassives(s,19);assert.equal(currentRoom(s).turrets.length,0);s.projectiles=[];tickPassives(s,.5);assert.equal(turretEndings(currentRoom(s)).length,0);assert.equal(s.projectiles.length,0);
});
test('four slime fragments maintain bounded hazards over a minute',()=>{
 const room={obstacles:[],hazards:[],enemies:Array.from({length:4},(_,i)=>({...foe(i,200+i*150,200),type:'boss',variant:'slime',stage:2,cd:i*.35,gasClock:i*.6}))};let max=0;
 for(let frame=0;frame<3600;frame++){const p={x:480+250*Math.sin(frame/90),y:320};for(const e of room.enemies)updatePoisonEnemy(e,p,room,1/60,[]);updateHazards(room,1/60,p,()=>{});max=Math.max(max,room.hazards.length);assert.ok(room.hazards.length<=12);}
 assert.ok(max>0);assert.ok(room.enemies.every(e=>e.poisonTurn>3));
});
