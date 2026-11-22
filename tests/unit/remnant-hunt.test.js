import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom,travel} from '../../src/game/engine.js';
import {stepRun} from '../../src/game/simulation.js';
import {challengeDemon,updateDemon} from '../../src/combat/demon.js';
import {REMNANT_PARTS,remnantSeal,remnantFragments,remnantReachableRooms,canEnterRemnantRoom} from '../../src/world/remnant-hunt.js';
import {configureBossLayout} from '../../src/game/boss-layout.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
import {startRemnantAttack} from '../../src/combat/remnant-hunt.js';
import {createPractice,practiceCleared} from '../../src/game/boss-practice.js';

const make=campaign=>newRun(77,{campaign,bossLayoutVersion:1});
function defeat(s){for(const e of currentRoom(s).enemies)e.hp=0;s.attack=999;s.invulnerable=999;s.entryGrace=0;return stepRun(s,.01);}
function gather(s){s.floor=7;for(const index of remnantSeal(s).rooms){s.room=index;currentRoom(s).seen=true;const result=defeat(s);assert.ok(result.events.includes('remnantFragment'));assert.ok(!result.events.some(e=>['key','stairs','xpBoss'].includes(e)));}s.room=s.floors[7].findIndex(r=>r.remnantSeal);return currentRoom(s);}
test('five unique fragments are reachable outside the locked boss room and seeded deterministically',()=>{
 const arrangements=new Set();for(let seed=0;seed<32;seed++){const s=newRun(seed,{bossLayoutVersion:1}),seal=remnantSeal(s),reachable=remnantReachableRooms(s.floors[7]);assert.equal(s.remnantHuntVersion,1);assert.equal(new Set(seal.rooms).size,5);assert.ok(seal.rooms.every(i=>reachable.includes(i)));assert.deepEqual(seal.rooms,newRun(seed,{bossLayoutVersion:1}).floors[7].find(r=>r.remnantSeal).remnantSeal.rooms);arrangements.add(seal.rooms.join(','));assert.doesNotThrow(()=>parseSave(encodeSave(s)));}assert.ok(arrangements.size>1);
});
test('fragments open only their boss door, survive reload and cannot be claimed twice',()=>{
 let s=make('classic');s.floor=7;s.room=s.floors[7].findIndex(r=>r.remnantSeal);assert.equal(canEnterRemnantRoom(s,s.room),false);assert.equal(challengeDemon(s),false);
 for(let n=0;n<5;n++){s.room=remnantSeal(s).rooms[n];assert.ok(defeat(s).events.includes('remnantFragment'));assert.equal(remnantFragments(s),n+1);assert.ok(!defeat(s).events.includes('remnantFragment'));s=parseSave(encodeSave(s));}
 s.room=s.floors[7].findIndex(r=>r.remnantSeal);assert.equal(canEnterRemnantRoom(s,s.room),true);assert.equal(challengeDemon(s),true);assert.equal(currentRoom(s).remnantBattle.stage,'whole');assert.doesNotThrow(()=>parseSave(encodeSave(s)));
});
test('whole defeat summons all five together and only final split completion grants stairs or key once',()=>{
 for(const campaign of ['classic','expanded']){let s=make(campaign),r=gather(s);assert.equal(challengeDemon(s),true);const result=defeat(s);assert.ok(result.events.includes('remnantSplit'));assert.ok(!result.events.some(e=>['key','stairs','xpBoss'].includes(e)));assert.equal(r.used,false);assert.equal(r.enemies.length,5);assert.deepEqual(r.enemies.map(e=>e.part),REMNANT_PARTS);assert.equal(r.relicOffers,undefined);s=parseSave(encodeSave(s));r=currentRoom(s);
  const last=defeat(s);assert.ok(last.events.includes('remnantComplete'));assert.ok(last.events.includes(campaign==='classic'?'key':'stairs'));assert.ok(last.events.includes('xpBoss'));assert.ok(r.used);assert.equal(r.relicOffers.length,3);assert.ok(!defeat(s).events.some(e=>['key','stairs','xpBoss'].includes(e)));assert.doesNotThrow(()=>parseSave(encodeSave(s)));if(campaign==='expanded')assert.equal(travel(s,1),true);
 }
});
test('partial split kills remove the defeated owner warning before a save',()=>{
 const s=make('expanded'),r=gather(s);challengeDemon(s);defeat(s);const e=r.enemies[0];r.remnantBattle.attacks=[startRemnantAttack(e,s.player,0)];e.hp=0;s.attack=999;stepRun(s,.01);assert.equal(r.enemies.length,4);assert.equal(r.remnantBattle.attacks.some(a=>a.owner===e.part),false);assert.doesNotThrow(()=>parseSave(encodeSave(s)));
});
test('whole attacks lock targets during warning and split attacks are capped at two',()=>{
 const s=make('expanded'),r=gather(s);challengeDemon(s);r.remnantBattle.partClocks={core:0};const bullets=[];updateDemon(s,r,s.player,.01,bullets,()=>{});const first=structuredClone(r.remnantBattle.attacks[0]);s.player.x=800;updateDemon(s,r,s.player,.1,bullets,()=>{});assert.equal(r.remnantBattle.attacks[0].tx,first.tx);assert.equal(r.remnantBattle.attacks[0].aim,first.aim);defeat(s);r.remnantBattle.partClocks=Object.fromEntries(REMNANT_PARTS.map(p=>[p,0]));updateDemon(s,r,s.player,.01,[],()=>{});assert.equal(r.enemies.length,5);assert.equal(r.remnantBattle.attacks.length,2);assert.doesNotThrow(()=>encodeSave(s));
});
test('saves reject duplicate locations, fabricated fragments and invalid attack owners',()=>{
 const s=make('classic');const bad=mutate=>{const copy=structuredClone(s);mutate(copy);assert.throws(()=>encodeSave(copy));};bad(copy=>remnantSeal(copy).rooms[1]=remnantSeal(copy).rooms[0]);bad(copy=>remnantSeal(copy).defeated.push('hand'));bad(copy=>{const r=copy.floors[7][remnantSeal(copy).rooms[0]];r.remnantBattle.attacks=[{...startRemnantAttack(r.enemies[0],copy.player,0),owner:'core'}];});
});
test('pre-hunt saved revised expeditions retain their original three-stage remnant encounter',()=>{
 const s=newRun(77,{campaign:'expanded'});s.bossLayoutVersion=1;configureBossLayout(s);const copy=parseSave(encodeSave(s));assert.equal(copy.remnantHuntVersion,undefined);copy.floor=7;copy.room=copy.floors[7].findIndex(r=>r.type==='boss');assert.equal(challengeDemon(copy),true);assert.equal(currentRoom(copy).demon.phase,1);assert.equal(currentRoom(copy).remnantBattle,undefined);
});
test('remnant practice skips fragment exploration and completes only after the simultaneous split',()=>{
 const s=createPractice('demon','fire',42),r=currentRoom(s);assert.equal(remnantFragments(s),5);assert.equal(r.remnantBattle.stage,'whole');assert.equal(practiceCleared(s),false);defeat(s);assert.equal(r.enemies.length,5);assert.equal(practiceCleared(s),false);const result=defeat(s);assert.ok(result.events.includes('practiceWon'));assert.equal(practiceCleared(s),true);assert.equal(s.key,false);
});
