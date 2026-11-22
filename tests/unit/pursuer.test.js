import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,enrage,currentRoom} from '../../src/game/engine.js';
import {enterRoom,stepRun,enemyRadius} from '../../src/game/simulation.js';
import {planPursuerEncounters,activatePursuerEncounter,rewardPursuer} from '../../src/world/pursuer-encounters.js';
import {updatePursuer,PURSUER,resetPursuerAttack} from '../../src/combat/pursuer.js';
import {takeDamage} from '../../src/combat/survival.js';
import {weaponContactReplaced} from '../../src/combat/enemy-melee.js';
import {warningActive} from '../../src/combat/tactics.js';
import {pursuerPose,drawPursuerWarning} from '../../src/rendering/pursuer-sprite.js';
import {floorAssetPlan,portraitAssetPlan,assetPlanFiles} from '../../src/rendering/asset-packs.js';
import {enemyDeathEffect} from '../../src/rendering/enemy-feedback.js';
import {tickOrdinaryPresentation,notifyOrdinaryHits,ordinaryPose,resetOrdinaryPresentation} from '../../src/rendering/ordinary-presentation-state.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
import {blocked} from '../../src/world/terrain.js';
import {castRoll} from '../../src/combat/roll.js';
import {strengthenPursuer} from '../../src/combat/balance.js';

test('pursuer health migration preserves injury once, keeps dead enemies dead and caps old warnings',()=>{
 const e={type:'pursuer',hp:200,max:800,attackPhase:'warning',attackTime:.9};strengthenPursuer(e);assert.equal(e.max,1600);assert.equal(e.hp,400);assert.equal(e.attackTime,.75);
 const before=JSON.stringify(e);strengthenPursuer(e);assert.equal(JSON.stringify(e),before);
 const dead={type:'pursuer',hp:0,max:1000};strengthenPursuer(dead);assert.equal(dead.hp,0);
 const normal={type:'chaser',hp:100,max:100};strengthenPursuer(normal);assert.deepEqual(normal,{type:'chaser',hp:100,max:100});
});

function combat(){return {e:{id:0,type:'pursuer',x:200,y:250,hp:800,max:800,cd:0},p:{x:400,y:250},r:{obstacles:[]}};}
function planned(){const s=newRun(47);enrage(s);let found;s.floors.forEach((f,floor)=>f.forEach((r,index)=>{if(!found&&r.pursuerEncounter)found={r,floor,index};}));assert.ok(found);s.floor=found.floor;s.room=found.index;Object.assign(s.player,{x:65,y:270});return {s,p:s.player,r:found.r};}
function active(){const v=planned();enterRoom(v.s);v.e=v.r.enemies.find(e=>e.type==='pursuer');assert.ok(v.e);return v;}
test('descent plans are independent, capped and exclude entrances, services, bosses and already deployed/current rooms',()=>{
 const a=newRun(47),b=newRun(47);assert.equal(a.pursuerVersion,undefined);enrage(a);enrage(b);const plans=s=>s.floors.map(f=>f.map(r=>r.pursuerEncounter??null));assert.deepEqual(plans(a),plans(b));
 const rng=a.randomState,crit=a.critical.randomState,before=JSON.stringify(plans(a));planPursuerEncounters(a);assert.equal(a.randomState,rng);assert.equal(a.critical.randomState,crit);assert.equal(JSON.stringify(plans(a)),before);
 a.floors.forEach((f,i)=>{assert.ok(f.filter(r=>r.pursuerEncounter).length<=1);if(i===0||i>=8)assert.ok(f.every(r=>!r.pursuerEncounter));for(const r of f.filter(r=>r.pursuerEncounter))assert.ok(r.type==='normal'&&!r.hasChest&&!r.gate&&!r.tutorial);});
});
test('activation replaces one actor, keeps stable ID and respects the larger body clearance on deployment',()=>{
 const {s,r,p}=planned(),count=r.enemies.length;enterRoom(s);const e=r.enemies.find(e=>e.type==='pursuer');assert.equal(r.enemies.length,count);assert.equal(enemyRadius(e),30);assert.equal(e.xpReward,90);assert.ok(e.escapeDepth>0);assert.equal(blocked(e.x,e.y,30,r.obstacles),false);assert.ok(Math.hypot(e.x-p.x,e.y-p.y)>=155);
 assert.equal(r.pursuerEncounter.enemyId,e.id);assert.equal(typeof e.rankingId,'number');const hp=e.hp-10;e.hp=hp;enterRoom(s);assert.equal(e.hp,hp);assert.equal(e.attackPhase,null);
});
test('charge locks its direction, gives a separate finishing warning, and hits at most once per stage',()=>{
 const {e,p,r}=combat(),hits=[];updatePursuer(e,p,r,.01,(...h)=>hits.push(h));assert.equal(e.attackPhase,'warning');const aim=e.aim;p.y=350;updatePursuer(e,p,r,.4,(...h)=>hits.push(h));assert.equal(e.aim,aim);assert.equal(hits.length,0);
 p.y=250;updatePursuer(e,p,r,.5,(...h)=>hits.push(h));assert.equal(e.attackPhase,'dash');updatePursuer(e,p,r,.5,(...h)=>hits.push(h));assert.equal(e.attackPhase,'cleaveWarning');assert.equal(hits.length,1);
 p.x=e.x+Math.cos(e.aim)*50;p.y=e.y+Math.sin(e.aim)*50;updatePursuer(e,p,r,.6,(...h)=>hits.push(h));assert.equal(e.attackPhase,'cleave');assert.equal(hits.length,1);updatePursuer(e,p,r,.1,(...h)=>hits.push(h));updatePursuer(e,p,r,.1,(...h)=>hits.push(h));assert.equal(hits.length,2);assert.equal(hits[1][2],'pursuerHeavy');
});
test('walls stop charging with a long recovery, no through-wall damage or immediate finishing attack',()=>{
 const {e,p,r}=combat();e.attackPhase='dash';e.attackTime=.5;e.aim=0;e.dashHit=false;r.obstacles=[{x:260,y:100,w:30,h:300}];const hits=[];updatePursuer(e,p,r,.5,(...h)=>hits.push(h));assert.equal(e.x,200);assert.equal(e.attackPhase,'recover');assert.equal(e.attackTime,2.1);assert.equal(hits.length,0);
});
test('cleave respects facing and walls, recovery is quiet, and idle contact never hurts',()=>{
 for(const behind of [true,false]){const {e,p,r}=combat();e.attackPhase='cleave';e.attackTime=.22;e.aim=0;e.cleaveHit=false;if(behind)p.x=150;else{p.x=270;r.obstacles=[{x:230,y:200,w:20,h:100}];}const hits=[];updatePursuer(e,p,r,.3,(...h)=>hits.push(h));assert.equal(hits.length,0);assert.equal(e.attackPhase,'recover');assert.equal(weaponContactReplaced(e),true);}
});
test('descent heavy strike causes two hearts but respects ordinary shields and invulnerability',()=>{
 const s=newRun(47);s.key=true;s.player.hp=5;s.invulnerable=0;takeDamage(s,18,'pursuerHeavy');assert.equal(s.player.hp,3);takeDamage(s,18,'pursuerHeavy');assert.equal(s.player.hp,3);s.invulnerable=0;s.player.armor=1;s.shield=0;assert.equal(takeDamage(s,18,'pursuerHeavy'),'blocked');assert.equal(s.player.hp,3);
});
test('real simulation heavy strike deals two hearts and a successful roll avoids the same cone',()=>{
 const {s,r,e,p}=active();r.obstacles=[];r.enemies=[e];Object.assign(e,{x:300,y:250,spawnGrace:0,attackPhase:'cleave',attackTime:.22,aim:0,cleaveHit:false});Object.assign(p,{x:350,y:250,hp:5,armor:0});s.attack=99;s.entryGrace=0;s.invulnerable=0;
 const result=stepRun(s,.01);assert.equal(p.hp,3);assert.ok(result.effects.some(f=>f.hitSource==='봉인 추적자 중량 베기'));
 p.hp=5;s.invulnerable=0;s.dodge=0;Object.assign(e,{attackPhase:'cleave',attackTime:.22,cleaveHit:false});assert.equal(castRoll(s,{x:0,y:1}),true);stepRun(s,.01);assert.equal(p.hp,5);
});
test('actual defeat grants 90XP, guaranteed essence and one recovery reward only once',()=>{
 const {s,r,e,p}=active();p.potions=1;e.hp=0;e.x=750;e.y=350;const result=stepRun(s,0);assert.ok(result.events.includes('pursuerReward'));assert.equal(r.xpDroppedTotal,90);assert.equal(r.essences.length,1);assert.equal(p.potions,2);stepRun(s,0);assert.equal(p.potions,2);assert.equal(r.xpDroppedTotal,90);assert.ok(parseSave(encodeSave(s)));
});
test('full potion inventory substitutes a health essence, never exceeds the potion cap',()=>{
 const {s,r,e,p}=active();p.potions=5;e.hp=0;r.enemies=r.enemies.filter(n=>n!==e);assert.equal(rewardPursuer(s,r,e),true);assert.equal(p.potions,5);assert.deepEqual(r.essences,[{id:'health',x:e.x+14,y:e.y}]);assert.equal(rewardPursuer(s,r,e),false);
});
test('AI phase and encounter save roundtrip, malformed combat and reward state reject',()=>{
 const {s,r,e}=active();e.cd=0;r.obstacles=[];Object.assign(e,{x:300,y:250});Object.assign(s.player,{x:450,y:250});updatePursuer(e,s.player,r,.01,()=>{});assert.equal(e.attackPhase,'warning');const loaded=parseSave(encodeSave(s));assert.ok(loaded);assert.equal(currentRoom(loaded).enemies.find(e=>e.type==='pursuer').attackPhase,'warning');
 for(const mutate of [v=>currentRoom(v).pursuerEncounter.rewarded=true,v=>currentRoom(v).pursuerEncounter.enemyId=99999,v=>currentRoom(v).enemies.find(e=>e.type==='pursuer').attackTime=10,v=>delete currentRoom(v).enemies.find(e=>e.type==='pursuer').aim,v=>v.key=false]){const broken=structuredClone(s);mutate(broken);assert.throws(()=>encodeSave(broken));}
});
test('real poses are phase-driven, walk strides vary, no hurt twitch, and death uses dedicated frames',()=>{
 const {e}=combat();const walk=[0,12,24,36].map(distance=>pursuerPose(e,{distance,moving:true}).index);assert.deepEqual(walk,[1,2,3,4]);for(const [attackPhase,index] of [['warning',5],['dash',6],['cleave',8],['recover',9]]){e.attackPhase=attackPhase;e.attackTime=.5;assert.equal(pursuerPose(e).index,index);}resetPursuerAttack(e);assert.equal(pursuerPose(e).index,0);
 resetOrdinaryPresentation([{seen:true,enemies:[e]}]);tickOrdinaryPresentation({enemies:[e]},.01);notifyOrdinaryHits({enemies:[e]},[{enemyFeedback:'hit',enemyId:e.id,beforeRatio:1,afterRatio:.8}]);assert.equal(ordinaryPose(e),null);e.hp=0;assert.equal(pursuerPose(e).index,11);const f=enemyDeathEffect(e,true);assert.equal(f.bodyType,'pursuer');assert.equal(f.duration,.75);
});
test('asset gate includes the real sheet for descent and portraits; warning geometry survives reduced mode without writes',()=>{
 assert.ok(assetPlanFiles(floorAssetPlan(2,{returning:true})).includes('pursuer-atlas-v1.png'));assert.ok(assetPlanFiles(portraitAssetPlan('pursuer')).includes('pursuer-atlas-v1.png'));
 const {e,p,r}=combat();updatePursuer(e,p,r,.01,()=>{});const before=JSON.stringify(e),calls=[],c=new Proxy({},{get:(t,k)=>k in t?t[k]:(...args)=>calls.push([k,...args]),set:(t,k,v)=>(t[k]=v,true)});drawPursuerWarning(c,e,false);assert.ok(warningActive(e));assert.ok(calls.some(c=>c[0]==='lineTo'));calls.length=0;e.attackPhase='cleaveWarning';e.attackTime=.6;drawPursuerWarning(c,e,true);assert.ok(calls.some(c=>c[0]==='arc'&&c[3]===PURSUER.reach));assert.ok(calls.some(c=>c[0]==='fillText'&&c[1]==='!! 2♥'));e.attackPhase='warning';e.attackTime=PURSUER.warning;assert.equal(JSON.stringify(e),before);
});
