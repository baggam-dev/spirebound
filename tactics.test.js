import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom,enrage} from './engine.js';
import {coordinateAttack} from './tactics.js';
import {rerollSkills} from './progression.js';
import {encodeSave,parseSave} from './storage.js';
import {stepRun} from './simulation.js';
import {updateElites} from './elites.js';
import {updatePattern} from './patterns.js';
import {updatePrism} from './prism.js';
import {updateHazards} from './poison.js';
import {encounter} from './encounters.js';
const enemy=(id,type='archer')=>({id,type,x:400,y:300,hp:100,max:100,cd:0,balanceVersion:1});
test('reroll consumes one run charge, preserves points and stores exact candidates',()=>{
 let s=newRun(1);s.player.mainSkill='fire';s.player.fire=1;s.pendingLevels=1;s.choices=['fire','power','haste'];assert.ok(rerollSkills(s));assert.equal(s.rerolls,0);assert.equal(s.pendingLevels,1);const before=JSON.stringify(s.choices);s=parseSave(encodeSave(s));assert.equal(JSON.stringify(s.choices),before);assert.equal(rerollSkills(s),false);assert.equal(JSON.stringify(s.choices),before);
});
test('legacy reroll allowance is once only and invalid contexts do not spend it',()=>{
 const s=newRun(2);delete s.rerolls;assert.equal(rerollSkills(s),false);s.player.mainSkill='frost';s.player.frost=1;s.pendingLevels=1;s.choices=['frost','aura','power'];assert.ok(rerollSkills(s));assert.equal(parseSave(encodeSave(s)).rerolls,0);s.rerolls=2;assert.throws(()=>encodeSave(s));
});
test('two warnings defer another start but never interrupt an attack already telegraphed',()=>{
 const a=enemy(0),b=enemy(1),c=enemy(2,'brute');a.attackPhase='warning';b.phase='aim';const r={enemies:[a,b,c]};assert.equal(coordinateAttack(c,r),false);c.phase='windup';assert.equal(coordinateAttack(c,r),true);delete c.phase;b.phase=null;assert.equal(coordinateAttack(c,r),true);
});
test('charging into cover stops contact damage and creates a saved opening',()=>{
 const s=newRun(1),r=currentRoom(s);s.attack=999;s.player.x=700;const e=enemy(0,'charger');e.cd=.2;e.chargeAngle=0;e.x=450;r.enemies=[e];r.obstacles=[{x:480,y:250,w:30,h:100,type:'rock'}];stepRun(s,.1);assert.ok(e.opening>0);assert.equal(e.chargeAngle,undefined);const loaded=parseSave(encodeSave(s)),x=currentRoom(loaded).enemies[0].x;stepRun(loaded,.2);assert.equal(currentRoom(loaded).enemies[0].x,x);assert.equal(loaded.player.hp,5);
});
test('volley elites stop their normal AI after their added salvo',()=>{
 const s=newRun(2),r=currentRoom(s);s.attack=999;const e=enemy(0,'chaser');e.elite='volley';e.eliteWarning=.01;e.eliteAim=0;r.enemies=[e];updateElites(r,.02,s.projectiles,s.player);assert.equal(s.projectiles.length,3);assert.equal(e.opening,1.25);const x=e.x;stepRun(s,.1);assert.equal(e.x,x);
});
test('warden slam, prism laser and expired slime aura expose their owner',()=>{
 const w={...enemy(0,'boss'),attackPhase:'leap',attackTime:.01,fromX:400,fromY:300,targetX:400,targetY:300};updatePattern(w,{x:800,y:300},[],.02,[]);assert.equal(w.opening,1.2);
 const p={...enemy(1,'boss'),prismPhase:'beam',prismTime:.01};updatePrism(p,{x:800,y:300},[],.02,[]);assert.equal(p.opening,1.2);
 const e={...enemy(2,'boss'),variant:'slime'},r={enemies:[e],hazards:[{owner:2,kind:'aura',phase:'active',time:.01,x:400,y:300,r:80}]};updateHazards(r,.02,{x:800,y:300},()=>{});assert.equal(e.opening,1.2);assert.equal(r.hazards.length,0);
});
test('support-led formations contain a guardian, escorts and staggered initial clocks',()=>{
 const pack=encounter(2,()=>.01,[]);assert.equal(pack[0].elite,'guardian');assert.equal(pack[0].role,'수호 핵심');assert.ok(pack.some(e=>e.type==='archer'));assert.ok(new Set(pack.map(e=>e.cd)).size>=3);assert.notEqual(pack[1].y,pack[3].y);
});
test('crowded charging packs do not starve ranged attacks or reset deferred cooldowns',()=>{
 const waiting=enemy(2);waiting.cd=.2;const a={...enemy(0),attackPhase:'warning'},b={...enemy(1),phase:'aim'};coordinateAttack(waiting,{enemies:[a,b,waiting]});assert.equal(waiting.cd,.2);
 const s=newRun(917);enrage(s);s.floor=0;s.room=s.floors[0].findIndex(r=>r.enemies.some(e=>e.type==='scatter'));s.player.y=360;s.attack=999;s.invulnerable=999;let peak=0;for(let i=0;i<1200;i++){stepRun(s,1/60);peak=Math.max(peak,s.projectiles.length);}assert.ok(peak>0);assert.ok(currentRoom(s).enemies.filter(e=>e.type==='scatter').every(e=>e.patternIndex>0));
});
