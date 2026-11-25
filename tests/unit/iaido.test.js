// Prepared for the next explicit deployment verification; not executed during implementation.
import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom,advanceClock} from '../../src/game/engine.js';
import {castRoll,tickRoll,rollProfile,rollAvailable,rollCharges,rollImmune} from '../../src/combat/roll.js';
import {applySkill} from '../../src/progression/progression.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
function setup(rank=3){const s=newRun(85),r=currentRoom(s);r.obstacles=[];r.enemies=[];s.player.rollMastery=rank;s.player.evolutions={rollMastery:'slash'};s.player.critChance=0;s.attack=99;return {s,r};}
test('only the selected iaido branch gains second and third mastery ranks',()=>{
 const {s}=setup(1);assert.ok(applySkill(s.player,'rollMastery'));assert.ok(applySkill(s.player,'rollMastery'));assert.equal(s.player.rollMastery,3);assert.equal(applySkill(s.player,'rollMastery'),false);
 for(const branch of ['mines','swift',null]){const {s}=setup(1);s.player.evolutions=branch?{rollMastery:branch}:{};assert.equal(applySkill(s.player,'rollMastery'),false);}
});
test('three separately aimed fast cuts spend three charges, hit once per cut and recharge together',()=>{
 const {s,r}=setup(),effects=[];r.enemies=[{id:5,type:'archer',x:550,y:300,hp:1000,max:1000,cd:99,balanceVersion:1}];
 assert.equal(rollProfile(s.player).duration,.08);
 for(let i=0;i<3;i++){
  assert.ok(castRoll(s,{x:i%2?-1:1,y:0}));assert.ok(rollImmune(s));assert.equal(rollAvailable(s),false);
  for(let j=0;j<8;j++)tickRoll(s,r,.01,effects);
  assert.equal(s.roll,undefined);assert.equal(rollImmune(s),false);assert.equal(rollCharges(s),2-i);assert.equal(r.enemies[0].hp,1000-51*(i+1));
 }
 assert.equal(castRoll(s,{x:1,y:0}),false);assert.equal(effects.filter(f=>f.iaidoKind==='cut').length,3);
 advanceClock(s,s.dodge,false);tickRoll(s,r,0,[]);assert.equal(rollCharges(s),3);assert.ok(rollAvailable(s));
});
test('reload retains spent charges and cooldown but never replays an in-flight slash',()=>{
 const {s,r}=setup();castRoll(s,{x:1,y:0});tickRoll(s,r,.02,[]);const position=s.player.x,cooldown=s.dodge;
 const loaded=parseSave(encodeSave(s));assert.equal(loaded.roll,undefined);assert.equal(loaded.player.x,position);assert.equal(loaded.dodge,cooldown);assert.equal(rollCharges(loaded),2);
 const again=parseSave(encodeSave(loaded));assert.equal(rollCharges(again),2);assert.equal(again.player.x,position);
});
test('legacy cooling-down iaido loads at rank one without a free reset',()=>{
 const {s}=setup(1);s.dodge=2;delete s.slashCharges;delete s.slashChargeRank;
 const loaded=parseSave(encodeSave(s));assert.equal(loaded.player.rollMastery,1);assert.equal(rollCharges(loaded),0);assert.equal(loaded.dodge,2);
});
test('wall rejection does not spend a charge and a wall blocks targets behind it',()=>{
 const {s,r}=setup();r.obstacles=[{x:520,y:180,w:30,h:240,type:'rock'}];r.enemies=[{id:2,type:'archer',x:580,y:300,hp:1000,max:1000,cd:99,balanceVersion:1}];
 assert.ok(castRoll(s,{x:1,y:0}));tickRoll(s,r,.08,[]);assert.ok(s.player.x<=506);assert.equal(r.enemies[0].hp,1000);
 const before=rollCharges(s);assert.equal(castRoll(s,{x:1,y:0}),false);assert.equal(rollCharges(s),before);
});
