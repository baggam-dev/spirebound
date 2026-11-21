import test from 'node:test';
import assert from 'node:assert/strict';
import {captureUtilityVisuals,utilityTransitionEffects,utilityCastEffect,limitUtilityEffects,drawExpandedUtilityStates,drawUtilityEffect} from '../../src/rendering/utility-effects.js';
import {tickBloodContract} from '../../src/combat/utility.js';
const run=()=>({floor:0,room:0,elapsed:10,player:{x:240,y:300,hp:4,max:5,focusTime:1},bloodTime:1,guardianTime:1,guardianCharges:1});
test('utility expiry distinguishes actual absorption and does not replay across rooms or on a dead player',()=>{
 const s=run(),before=captureUtilityVisuals(s);s.player.focusTime=0;s.bloodTime=0;s.guardianTime=0;s.guardianCharges=0;
 const result={effects:[{utilityFx:'guardianBreak'}],events:[]},snapshot=JSON.stringify({s,result});
 assert.deepEqual(utilityTransitionEffects(before,s,result).map(f=>f.utilityFx),['focusExpire','bloodExpire']);assert.equal(JSON.stringify({s,result}),snapshot);
 result.effects=[];assert.ok(utilityTransitionEffects(before,s,result).some(f=>f.utilityFx==='guardianExpire'));
 s.room=1;assert.deepEqual(utilityTransitionEffects(before,s,result),[]);s.room=0;s.player.hp=0;assert.deepEqual(utilityTransitionEffects(before,s,result),[]);
});
test('blood heal particles require an actual HP increase without changing contract credit consumption',()=>{
 for(const hp of [4,5]){const s=run();s.player.hp=hp;s.bloodTime=8;s.bloodCredits=1;s.bloodHeals=0;s.bloodKills=0;const effects=[];
  tickBloodContract(s,{enemies:[]},.1,effects);assert.equal(s.player.hp,5);assert.equal(s.bloodHeals,1);assert.equal(s.bloodCredits,0);
  assert.equal(effects.filter(f=>f.utilityFx==='bloodHeal').length,hp===4?1:0);
  if(hp===5)assert.ok(effects.some(f=>f.text?.includes('체력 가득')));
 }
});
test('utility visual budget keeps newest effects without dropping damage text or unrelated feedback',()=>{
 const effects=[{text:'damage'},...Array.from({length:5},(_,id)=>({utilityFx:'focusShot',id})),{enemyFeedback:'death'}],snapshot=JSON.stringify(effects),kept=limitUtilityEffects(effects,2);
 assert.deepEqual(kept.filter(f=>f.utilityFx).map(f=>f.id),[3,4]);assert.equal(kept[0],effects[0]);assert.equal(kept.at(-1),effects.at(-1));assert.equal(JSON.stringify(effects),snapshot);
});
test('maintained utility rendering and real-shot accents never mutate combat state in either effects mode',()=>{
 const s=run(),snapshot=JSON.stringify(s),before=captureUtilityVisuals(s),shot=utilityTransitionEffects(before,s,{events:['shot','repeatShot'],effects:[]});assert.equal(shot.filter(f=>f.utilityFx==='focusShot').length,1);
 assert.equal(utilityCastEffect(s,'frostWave'),null);const effect=utilityCastEffect(s,'guardian');
 const stack=[],c=new Proxy({globalAlpha:1,save(){stack.push(this.globalAlpha);},restore(){this.globalAlpha=stack.pop();}},{get:(o,k)=>k in o?o[k]:()=>{}});
 for(const reduced of [false,true]){drawExpandedUtilityStates(c,s,{reduced});drawUtilityEffect(c,effect,{reduced,player:s.player});assert.equal(stack.length,0);assert.equal(c.globalAlpha,1);}
 assert.equal(JSON.stringify(s),snapshot);
});
