import test from 'node:test';
import assert from 'node:assert/strict';
import {enemyXpReward,enemyEssenceChance} from '../../src/progression/enemy-rewards.js';
import {dropEssences,collectEssences} from '../../src/progression/essences.js';
import {newRun,currentRoom,enrage} from '../../src/game/engine.js';
import {stepRun} from '../../src/game/simulation.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
const foe=extra=>({id:0,type:'chaser',x:700,y:270,hp:0,max:100,...extra});
function setup(){const s=newRun(31);s.tutorialComplete=true;s.attack=999;s.invulnerable=999;s.player.x=150;s.player.y=300;const r=currentRoom(s);r.obstacles=[];r.enemies=[];return {s,r};}
const value=r=>(r.xpDrops||[]).reduce((n,d)=>n+d.value,0);

test('risk XP uses one classification and preserves explicit tutorial awards',()=>{
 for(const [extra,xp] of [[{},12],[{elite:'volley'},18],[{elite:'guardian',trialChampion:true},24],[{gateTitle:'칼드',elite:'guardian',trialChampion:true},36],[{elite:'guardian',xpReward:11},11],[{elite:'volley',xpReward:0},0],[{summoned:true,elite:'volley'},0],[{type:'boss'},0]])assert.equal(enemyXpReward(foe(extra)),xp);
});

test('real defeats drop the risk XP on the floor and save/resume never repeats the award',()=>{
 for(const [extra,xp] of [[{},12],[{elite:'guardian'},18],[{trialChampion:true},24],[{gateTitle:'베라',elite:'volley'},36]]){
  let {s,r}=setup();r.enemies=[foe(extra)];stepRun(s,.01);assert.equal(s.player.xp,0);assert.equal(value(r),xp);assert.equal(r.xpDroppedTotal,xp);
  s=parseSave(encodeSave(s));r=currentRoom(s);stepRun(s,.01);assert.equal(value(r),xp);assert.equal(r.xpDroppedTotal,xp);
 }
});

test('descent keeps XP disabled even for an elite with a larger ascent reward',()=>{
 const {s}=setup();enrage(s);const r=currentRoom(s);r.enemies=[foe({elite:'guardian'})];r.obstacles=[];s.entryGrace=0;stepRun(s,.01);assert.equal(value(r),0);assert.equal(s.player.xp,0);
});

test('key and named essence thresholds have strict boundaries with no stacked elite chance',()=>{
 for(const key of [false,true])for(const [extra,room,chance] of [[{elite:'volley'},{},.05],[{trialChampion:true,elite:'volley'},{},.1],[{gateTitle:'칼드',elite:'guardian'},{},.25],[{elite:'guardian'},{returnSeal:'guardian',returnGuardianId:0},.1]]){
  const e=foe(extra),threshold=chance*(key?2:1);assert.equal(enemyEssenceChance(e,room),chance);
  let calls=0;const yes={...room};dropEssences({key},yes,e,()=>calls++===0?threshold-.00001:0);assert.equal(yes.essences.length,1);assert.equal(calls,2);
  const no={...room};dropEssences({key},no,e,()=>threshold);assert.equal(no.essences.length,0);
 }
});

test('only the assigned final-approach guardian gets one guaranteed essence and collection applies once',()=>{
 for(const depth of [1,2]){
  const {s,r}=setup();s.key=true;Object.assign(r,{returnSeal:'guardian',returnGuardianId:0,finalApproachDepth:depth});let calls=0;
  assert.equal(enemyEssenceChance(foe({id:1,elite:'guardian'}),r),.05);
  dropEssences(s,r,foe({elite:'guardian'}),()=>calls++===0?.999999:0);assert.equal(calls,2);assert.equal(r.essences.length,1);
  s.player.x=700;s.player.y=270;const damage=s.player.damage;assert.equal(collectEssences(s,r).length,1);assert.equal(s.player.damage,damage+3);assert.equal(collectEssences(s,r).length,0);
  const none={...r};delete none.essences;dropEssences(s,none,foe({summoned:true}),()=>0);assert.equal(none.essences,undefined);
 }
});
