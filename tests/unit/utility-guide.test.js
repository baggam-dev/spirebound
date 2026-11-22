import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom} from '../../src/game/engine.js';
import {canCastUtility,castUtility,utilityUseState} from '../../src/combat/utility.js';
import {utilityGuide} from '../../src/ui/utility-guide.js';
import {buildEntries} from '../../src/ui/build-window.js';
import {grantRelic,utilityCooldown} from '../../src/progression/relics.js';
const setup=id=>{const s=newRun(85);s.player.level=6;s.player.utility=id;s.player.hp=5;s.player.max=5;s.utilityCooldown=0;currentRoom(s).enemies=[];currentRoom(s).obstacles=[];return s;};
test('focus health failure reports the real cost without spending health or cooldown',()=>{
 const s=setup('focus');s.player.hp=1;const before=JSON.stringify(s);
 assert.equal(utilityUseState(s).code,'health');assert.equal(canCastUtility(s),false);assert.equal(castUtility(s),false);
 assert.match(utilityGuide(s).status,/1하트/);assert.equal(JSON.stringify(s),before);
 s.player.hp=2;assert.equal(utilityUseState(s).ready,true);
});
test('sigil guidance distinguishes absent, aerial, out-of-range and occluded targets from an eligible target',()=>{
 const s=setup('thunderSigil'),r=currentRoom(s),p=s.player,e={id:0,type:'archer',hp:100,max:100,x:p.x+100,y:p.y};
 assert.equal(utilityUseState(s).code,'target');r.enemies=[e];assert.equal(canCastUtility(s),true);
 e.phase='air';assert.equal(utilityUseState(s).code,'target');delete e.phase;
 e.x=p.x+501;assert.equal(utilityUseState(s).code,'target');e.x=p.x+100;
 r.obstacles=[{x:p.x+40,y:p.y-20,w:10,h:40,type:'wall'}];assert.equal(utilityUseState(s).code,'target');
});
test('pending, stun, arrival and cooldown show distinct reasons and a positive countdown never displays zero',()=>{
 const s=setup('guardian');s.utilityCooldown=.01;assert.equal(utilityGuide(s).short,'0.1초');assert.equal(canCastUtility(s),false);
 s.utilityCooldown=0;s.player.actionStun=.5;assert.equal(utilityUseState(s).code,'stunned');s.player.actionStun=0;
 currentRoom(s).wardenArrival=1;assert.equal(utilityUseState(s).code,'arrival');currentRoom(s).wardenArrival=0;
 s.player.utility='thunderSigil';s.utilityCast={id:'thunderSigil',remaining:.65};assert.equal(utilityUseState(s).code,'casting');assert.match(utilityGuide(s).active,/0.7초/);
});
test('remaining effect guidance separates spent defense or healing opportunities from continuing duration',()=>{
 const gale=setup('galeVeil');gale.player.galeTime=2;gale.player.galeCharges=0;assert.match(utilityGuide(gale).active,/이속 증가.*탄 소거 소진/);
 const blood=setup('firstAid');blood.bloodTime=5;blood.bloodHeals=2;assert.match(utilityGuide(blood).active,/2\/2회 소진/);assert.match(utilityGuide(blood).tip,/만피/);
 const shield=setup('guardian');shield.guardianTime=7;shield.guardianCharges=1;assert.match(utilityGuide(shield).active,/방어 1회 남음/);shield.guardianCharges=0;assert.equal(utilityGuide(shield).active,'');
});
test('all six build guides use the same skill rules and actual relic cooldown without writing the run',()=>{
 for(const id of ['focus','firstAid','guardian','frostWave','thunderSigil','galeVeil']){
  const s=setup(id);grantRelic(s.player,'ritualKnot');const before=JSON.stringify(s),guide=utilityGuide(s,{paused:true});
  assert.ok(guide.tip);assert.ok(guide.description.includes('재사용 '+Number(utilityCooldown(s.player,id).toFixed(2))+'초'));
  const entry=buildEntries(s,'skills').find(e=>e.id==='active:'+id);assert.equal(entry.description,guide.description);assert.ok(entry.note.includes(guide.tip));assert.equal(JSON.stringify(s),before);
 }
});
test('pause does not claim an owned skill can be pressed until play resumes; absent skills get acquisition guidance',()=>{
 const s=setup('frostWave');assert.equal(utilityGuide(s,{paused:true}).short,'일시정지');assert.match(utilityGuide(s,{paused:true}).status,/재개/);
 assert.equal(utilityGuide(s).short,'준비');delete s.player.utility;assert.equal(utilityUseState(s).code,'unowned');assert.match(utilityGuide(s).tip,/룰렛/);
});
