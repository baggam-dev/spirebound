import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom,canEscape} from '../../src/game/engine.js';
import {startFinalEscape,tickFinalEscape} from '../../src/world/final-escape.js';
import {SHADOW_BOSSES,shadowBaseMax} from '../../src/world/shadow-escape.js';
import {encodeSave,parseSave} from '../../src/persistence/storage.js';
import {stepRun} from '../../src/game/simulation.js';
import {splitSlime} from '../../src/combat/poison.js';
import {commanderPhase,updateCommander} from '../../src/combat/commander.js';
import {kingPhase,tickUpperState} from '../../src/combat/upper-floors.js';
import {commanderProfile,fastKing} from '../../src/combat/boss-pressure.js';
import {floorAssetOptions,floorAssetPlan} from '../../src/rendering/asset-packs.js';
function escape(){const s=newRun(47);s.key=true;s.tutorialComplete=true;s.attack=999;s.invulnerable=999;const r=currentRoom(s);r.enemies=[];assert.ok(startFinalEscape(s,r));return {s,r};}
test('five timed shadow rounds each summon one boss and two escorts without legacy bats',()=>{
 const {s,r}=escape();assert.equal(r.finalEscape.wave,0);tickFinalEscape(s,r,1.99);assert.equal(r.enemies.length,0);tickFinalEscape(s,r,.01);
 for(let wave=0;wave<5;wave++){if(wave)tickFinalEscape(s,r,10);assert.equal(r.finalEscape.wave,wave+1);assert.equal(r.enemies.length,(wave+1)*3);assert.deepEqual(r.enemies.filter(e=>e.shadowBoss).map(e=>e.variant||'warden'),SHADOW_BOSSES.slice(0,wave+1));assert.ok(!r.enemies.some(e=>e.type==='demonBat'));assert.doesNotThrow(()=>parseSave(encodeSave(s)));}
});
test('opening retains living enemies and projectiles and permits escape without kills',()=>{
 const {s,r}=escape();tickFinalEscape(s,r,42);s.projectiles=[{x:200,y:200,vx:100,vy:0,life:2,enemy:true,hit:[]}];const count=r.enemies.length;assert.equal(canEscape(s),false);assert.deepEqual(tickFinalEscape(s,r,10),['finalReady']);assert.equal(r.enemies.length,count);assert.equal(s.projectiles.length,1);assert.equal(canEscape(s),true);assert.deepEqual(tickFinalEscape(s,r,1),[]);assert.doesNotThrow(()=>parseSave(encodeSave(s)));
});
test('round progress reloads without duplicate summons or a second health reduction',()=>{
 let {s,r}=escape();tickFinalEscape(s,r,22);const maxes=r.enemies.filter(e=>e.shadowBoss).map(e=>e.max);s=parseSave(encodeSave(s));r=currentRoom(s);assert.deepEqual(r.enemies.filter(e=>e.shadowBoss).map(e=>e.max),maxes);tickFinalEscape(s,r,.1);assert.equal(r.enemies.length,9);for(const e of r.enemies.filter(e=>e.shadowBoss))assert.equal(e.shadowRootMax,Math.ceil(shadowBaseMax(s,e.variant||'warden')*.7));
});
test('slime splits once, children retain their shadow identity and cannot split again',()=>{
 const {s,r}=escape();tickFinalEscape(s,r,22);const slime=r.enemies.find(e=>e.variant==='slime');r.enemies=r.enemies.filter(e=>e!==slime);assert.equal(splitSlime(slime,r,s.player),true);const children=r.enemies.filter(e=>e.variant==='slime');assert.equal(children.length,2);assert.ok(children.every(e=>e.shadowBoss===1&&e.summoned&&e.shadowSplit===1));assert.equal(splitSlime(children[0],r,s.player),false);assert.doesNotThrow(()=>parseSave(encodeSave(s)));
});
test('commander remains phase one and Mordo remains final phase at full and low health',()=>{
 const {s,r}=escape();tickFinalEscape(s,r,42);const commander=r.enemies.find(e=>e.variant==='commander'),king=r.enemies.find(e=>e.variant==='king');for(const ratio of [1,.1]){commander.hp=commander.max*ratio;king.hp=king.max*ratio;assert.equal(commanderPhase(commander),1);assert.equal(commanderProfile(commander).count,4);updateCommander(commander,s.player,r,.01,[],()=>{});assert.equal(commander.commander.phase,1);assert.equal(kingPhase(king),3);assert.ok(fastKing(king));tickUpperState(king,s.player,r,.01,[]);assert.equal(king.guardPortal,undefined);assert.equal(king.kingTransition,undefined);}assert.doesNotThrow(()=>parseSave(encodeSave(s)));
});
test('shadow deaths do not grant original boss rewards or alter run completion',()=>{
 const {s,r}=escape();tickFinalEscape(s,r,42);const before={kills:s.kills,xp:s.player.xp,rank:s.ranking.defeated.length};for(const e of r.enemies)e.hp=0;let result=stepRun(s,.01);assert.ok(!result.events.some(e=>['key','stairs','xpBoss','gateReward'].includes(e)));assert.equal(r.relicOffers,undefined);assert.equal(s.kills,before.kills);assert.equal(s.player.xp,before.xp);assert.equal(s.ranking.defeated.length,before.rank);for(const e of r.enemies)e.hp=0;result=stepRun(s,.01);assert.ok(!result.events.includes('xpBoss'));assert.ok(!r.enemies.some(e=>e.variant==='slime'));
});
test('return floor asset plan includes every future shadow boss before the first round',()=>{
 const {s}=escape(),plan=floorAssetPlan(0,floorAssetOptions(s));for(const module of ['warden-sprite','prism-sprite','slime-sprite','commander-phase1-sprite','mordo-phase3-sprite'])assert.ok(plan.modules.includes(module),module);
});
test('malformed shadow saves reject wrong rounds, health scaling and phase limits',()=>{
 const {s,r}=escape();tickFinalEscape(s,r,42);for(const mutate of [x=>currentRoom(x).finalEscape.wave=4,x=>currentRoom(x).enemies.find(e=>e.variant==='king').max++,x=>currentRoom(x).enemies.find(e=>e.variant==='commander').commander.phase=2,x=>currentRoom(x).enemies.find(e=>e.variant==='slime').shadowSplit=2]){const copy=structuredClone(s);mutate(copy);assert.throws(()=>encodeSave(copy));}
});
