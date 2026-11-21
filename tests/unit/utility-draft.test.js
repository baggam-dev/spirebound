import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun} from '../../src/game/engine.js';
import {prepareUtilityDraft,revealUtilityDraft,claimUtilityDraft} from '../../src/progression/utility-draft.js';
import {castUtility} from '../../src/combat/utility.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
function eligible(){const s=newRun(85);s.player.level=5;s.floors[1].find(r=>r.type==='boss').used=true;return s;}

test('utility candidates and winner use a separate deterministic stream, never reroll, and exclude permanently unusable focus',()=>{
 const s=eligible(),clone=structuredClone(s),random=s.randomState,critical=JSON.stringify(s.critical);
 const q=prepareUtilityDraft(s);assert.equal(q.offers.length,3);assert.equal(new Set(q.offers).size,3);assert.ok(q.offers.includes(q.winner));assert.equal(q.status,'prepared');
 assert.deepEqual(prepareUtilityDraft(clone),q);assert.equal(prepareUtilityDraft(s),q);assert.equal(s.randomState,random);assert.equal(JSON.stringify(s.critical),critical);
 const low=eligible();low.player.hp=low.player.max=1;assert.ok(!prepareUtilityDraft(low).offers.includes('focus'));
});
test('prepared and revealed outcomes roundtrip; completion is idempotent and does not refill a cooldown',()=>{
 let s=eligible();const q=structuredClone(prepareUtilityDraft(s));assert.equal(claimUtilityDraft(s),false);
 s=parseSave(encodeSave(s));assert.deepEqual(prepareUtilityDraft(s),q);assert.ok(revealUtilityDraft(s));s=parseSave(encodeSave(s));
 assert.equal(s.utilityDraft.winner,q.winner);assert.ok(claimUtilityDraft(s));assert.equal(s.player.utility,q.winner);s.utilityCooldown=13;
 assert.ok(claimUtilityDraft(s));assert.equal(s.utilityCooldown,13);s=parseSave(encodeSave(s));assert.equal(s.utilityDraft.status,'claimed');assert.equal(s.utilityCooldown,13);
});
test('acquiring a paused reward cannot deadlock on an action stun and does not permit casting through the stun',()=>{
 const s=eligible();prepareUtilityDraft(s);revealUtilityDraft(s);s.player.actionStun=.5;
 assert.ok(claimUtilityDraft(s));assert.equal(s.player.actionStun,.5);assert.equal(castUtility(s),false);
});
test('legacy ownership, training and locked progression never create a replacement draw',()=>{
 const old=eligible();old.player.utility='guardian';assert.equal(prepareUtilityDraft(old),null);assert.equal(old.player.utility,'guardian');assert.equal(old.utilityDraft,undefined);
 const practice=eligible();practice.practice={boss:'warden'};assert.equal(prepareUtilityDraft(practice),null);
 const locked=newRun(85);assert.equal(prepareUtilityDraft(locked),null);
});
test('save validation rejects duplicate, foreign, premature and mismatched grants',()=>{
 const s=eligible();prepareUtilityDraft(s);const initial=structuredClone(s.utilityDraft);
 s.utilityDraft.offers[1]=s.utilityDraft.offers[0];assert.throws(()=>encodeSave(s));s.utilityDraft=structuredClone(initial);
 s.utilityDraft.winner='not-a-skill';assert.throws(()=>encodeSave(s));s.utilityDraft=structuredClone(initial);
 s.utilityDraft.status='claimed';assert.throws(()=>encodeSave(s));s.utilityDraft=structuredClone(initial);
 s.player.level=4;assert.throws(()=>encodeSave(s));
});
