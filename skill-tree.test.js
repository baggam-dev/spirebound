import test from 'node:test';
import assert from 'node:assert/strict';
import {chooseMain,skillPoints,mainSkills,steerArrow} from './skill-tree.js';
import {skillChoices,applySkill,hitEnemy,tickEffects} from './progression.js';
import {newRun,currentRoom} from './engine.js';
import {parseSave,encodeSave} from './storage.js';
import {stepRun,fireArrow,enterRoom} from './simulation.js';
import {seededRandom} from './random.js';
import {ultimateUnlocked} from './abilities.js';
import {updateHazards} from './poison.js';
const enemy=(id=0,x=600,y=300,type='archer')=>({id,x,y,type,hp:1000,max:1000,cd:10,balanceVersion:1});
test('first main consumes one earned point and permanently excludes other elements',()=>{
 const s=newRun(2);assert.equal(chooseMain(s,'fire'),false);s.pendingLevels=1;assert.ok(chooseMain(s,'fire'));assert.equal(s.pendingLevels,0);assert.equal(s.player.fire,1);assert.equal(chooseMain(s,'frost'),false);assert.equal(applySkill(s.player,'poison'),false);for(let i=0;i<200;i++)assert.ok(skillChoices(s.player).every(k=>!mainSkills.includes(k.id)||k.id==='fire'));
});
test('legacy mixed elements preserve total investment through explicit main choice and one-time refunds',()=>{
 let s=newRun(3);s.skillSystemVersion=13;Object.assign(s.player,{fire:3,poison:2,frost:1,haste:2,evolutions:{fire:'flare'}});s.pendingLevels=1;const total=skillPoints(s.player)+s.pendingLevels;s=parseSave(encodeSave(s));assert.equal(s.player.mainSkill,undefined);assert.ok(chooseMain(s,'poison'));assert.equal(s.player.poison,2);assert.equal(s.pendingLevels,5);assert.equal(s.player.evolutions.fire,undefined);assert.equal(skillPoints(s.player)+s.pendingLevels,total);s=parseSave(encodeSave(s));assert.equal(chooseMain(s,'fire'),false);assert.equal(s.pendingLevels,5);
});
test('choosing an unlearned main from an old build spends one refunded point',()=>{
 const s=newRun(2);s.player.fire=3;assert.ok(chooseMain(s,'chain'));assert.equal(s.player.chain,1);assert.equal(s.pendingLevels,2);assert.equal(s.player.fire,0);
});
test('rare support weights are lower and offers never duplicate',()=>{
 const p=newRun(2).player;p.mainSkill='fire';p.fire=1;const random=seededRandom(17),counts={};for(let i=0;i<6000;i++){const choices=skillChoices(p,random);assert.equal(new Set(choices.map(k=>k.id)).size,choices.length);for(const k of choices)counts[k.id]=(counts[k.id]||0)+1;}assert.ok(counts.homing<counts.repeat/2);assert.ok(counts.repeat<counts.haste/2);assert.ok(counts.split<counts.power/2);
});
test('level one frost freezes on the fourth primary impact and cannot permanently lock enemies',()=>{
 for(const type of ['archer','boss']){const e=enemy(0,600,300,type),p={damage:1,frost:1};hitEnemy(p,e,[e]);hitEnemy(p,e,[e]);assert.ok(!e.frozen);hitEnemy(p,e,[e]);assert.ok(!e.frozen);hitEnemy(p,e,[e]);assert.equal(e.frozen,type==='boss'?.45:1.2);for(let i=0;i<8;i++)hitEnemy(p,e,[e]);assert.equal(e.frostStacks,3);tickEffects(e,1.3);assert.equal(e.frozen,0);hitEnemy(p,e,[e]);assert.equal(e.frostStacks,3);tickEffects(e,2);hitEnemy(p,e,[e]);assert.equal(e.frostStacks,1);tickEffects(e,3.1);assert.equal(e.frostStacks,0);}
});
test('frozen attack phases and elite salvos stop and resume without restarting telegraphs',()=>{
 const s=newRun(1),r=currentRoom(s);s.attack=999;s.invulnerable=99;const e=enemy();e.frozen=1;e.freezeImmune=3;e.attackPhase='warning';e.attackTime=.7;e.pattern='burst';e.elite='volley';e.eliteWarning=.6;e.eliteAim=0;r.enemies=[e];stepRun(s,.5);assert.equal(e.attackTime,.7);assert.equal(e.eliteWarning,.6);assert.equal(s.projectiles.length,0);stepRun(s,.6);assert.ok(e.attackTime<.7);
});
test('repeat adds one delayed same-direction primary without repeating the split fan',()=>{
 const s=newRun(3);Object.assign(s.player,{repeat:1,split:4,frost:1,homing:1});fireArrow(s,{x:800,y:300});assert.equal(s.projectiles.length,6);const b=s.projectiles.at(-1);assert.equal(b.delay,.16);assert.equal(b.damageScale,.6);assert.equal(b.vy,0);assert.equal(b.elemental,true);s.attack=999;stepRun(s,.1);assert.ok(Math.abs(b.delay-.06)<1e-9);assert.equal(b.x,480);stepRun(s,.1);assert.ok(Math.abs(b.x-496.8)<1e-9);enterRoom(s);assert.equal(s.projectiles.length,0);
});
test('homing has a bounded turn rate, avoids walls and keeps projectile speed',()=>{
 const b={x:0,y:0,vx:420,vy:0,homing:true,hit:[]};steerArrow(b,[enemy(0,0,200)],[],.1,()=>false);assert.ok(Math.abs(Math.atan2(b.vy,b.vx)-.28)<1e-9);assert.ok(Math.abs(Math.hypot(b.vx,b.vy)-420)<1e-9);const before={...b};steerArrow(b,[enemy(0,0,200)],[],.1,()=>true);assert.deepEqual(b,before);
});
test('aura hits nearby grounded enemies only and damage support does not automatically unlock the ultimate',()=>{
 const s=newRun(1),r=currentRoom(s);s.player.aura=2;s.attack=999;r.enemies=[enemy(0,520),enemy(1,700)];stepRun(s,.5);assert.equal(r.enemies[0].hp,976);assert.equal(r.enemies[1].hp,1000);assert.equal(s.metrics.damageDealt,24);const e=enemy();hitEnemy({damage:20,power:5},e,[e]);assert.equal(e.hp,968);assert.equal(ultimateUnlocked({fire:1,power:2,aura:1,repeat:1}),false);
});
test('main lock, delayed homing shots and frozen states round-trip and reject corruption',()=>{
 const s=newRun(4);s.pendingLevels=1;chooseMain(s,'frost');s.player.repeat=1;s.player.homing=1;currentRoom(s).enemies=[enemy()];hitEnemy(s.player,currentRoom(s).enemies[0],currentRoom(s).enemies);fireArrow(s,{x:800,y:300});const loaded=parseSave(encodeSave(s));assert.equal(loaded.player.mainSkill,'frost');assert.equal(loaded.projectiles.at(-1).delay,.16);assert.equal(currentRoom(loaded).enemies[0].frostStacks,1);loaded.player.fire=1;assert.throws(()=>encodeSave(loaded));s.projectiles.at(-1).delay=-1;assert.throws(()=>encodeSave(s));
});
test('freezing stops unlaunched poison warnings but does not stop airborne projectiles',()=>{
 const e=enemy();e.frozen=1;const r={enemies:[e],hazards:[{owner:0,kind:'puddle',phase:'warning',time:.8,flight:.65,duration:2,x:800,y:400,r:30,damage:9},{owner:0,kind:'puddle',phase:'flight',time:.6,duration:2,x:800,y:400,r:30,damage:9}]};updateHazards(r,.2,{x:100,y:100},()=>{});assert.equal(r.hazards[0].time,.8);assert.ok(Math.abs(r.hazards[1].time-.4)<1e-9);
});
test('aura respects intervening cover and cannot damage airborne enemies',()=>{
 const s=newRun(1),r=currentRoom(s);s.attack=999;s.entryGrace=1;s.player.aura=3;r.obstacles=[{x:498,y:280,w:10,h:40,type:'rock'}];const a=enemy(0,520),b=enemy(1,450);b.phase='air';b.phaseTime=1;r.enemies=[a,b];stepRun(s,.1);assert.equal(a.hp,1000);assert.equal(b.hp,1000);
});
test('fire splash and field have enlarged radius and increased damage',()=>{
 const p={damage:20,fire:3},e=enemy(),r={enemies:[e]};hitEnemy(p,e,r.enemies,[],1,true,r);assert.ok(Math.abs(e.hp-(1000-20-36))<1e-9);assert.equal(r.fireZones?.length||0,0);assert.equal(e.burnField.r,75);assert.equal(e.burnField.dps,30);assert.equal(e.burnStacks[0].dps,9);
});
test('split secondary arrows carry the chosen element with proportional damage',()=>{
 const s=newRun(5);Object.assign(s.player,{mainSkill:'fire',fire:3,split:1});fireArrow(s,{x:800,y:300});assert.ok(s.projectiles.every(b=>b.elemental&&b.element==='fire'));const a=enemy(),b=enemy(),ra={enemies:[a]},rb={enemies:[b]};hitEnemy(s.player,a,ra.enemies,[],1,true,ra);hitEnemy(s.player,b,rb.enemies,[],.45,true,rb);assert.ok(Math.abs((1000-b.hp)/(1000-a.hp)-.45)<1e-9);assert.ok(Math.abs(b.burnField.dps/a.burnField.dps-.45)<1e-9);
});
