import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceCombatImpacts,combatImpactFilter,combatImpactShake,combatImpactState,resetCombatImpacts,drawCombatImpacts} from '../../src/rendering/combat-impact.js';
import {startBossClear,advanceBossClear,bossClearPhase,bossClearState,bossClearShake,drawBossClear,takeBossClearCues,skipBossClear} from '../../src/rendering/boss-clear.js';
const hit=(id=1,extra={})=>({enemyId:id,x:400,y:250,damage:30,applied:true,newHit:true,critical:false,...extra});
function context(){const calls=[];return {calls,globalAlpha:1,save(){},restore(){},beginPath(){},rect(){},clip(){},setLineDash(){},moveTo(){},lineTo(){},stroke(){},fillRect(...args){calls.push(['box',...args]);},strokeText(t){calls.push(['label',t]);},fillText(){}};}

test('contacts require real fresh damage and leave run, room and actors unchanged',()=>{
 const run={player:{x:100,y:100},randomState:9},room={enemies:[{id:1,hp:10}]},before=JSON.stringify({run,room});
 advanceCombatImpacts(run,room,.01,[hit(1,{applied:false}),hit(2,{newHit:false}),hit(3,{damage:0})]);
 assert.equal(combatImpactState(run).count,0);
 advanceCombatImpacts(run,room,.01,[hit()]);assert.equal(combatImpactState(run).count,1);
 assert.ok(combatImpactFilter(run,room.enemies[0]));assert.equal(JSON.stringify({run,room}),before);
 assert.deepEqual(combatImpactShake(run),{x:0,y:0});
});

test('multi-hit contacts coalesce per target with a bounded pool and no DoT flash restart',()=>{
 const run={},room={};advanceCombatImpacts(run,room,.01,[hit(),hit(1,{critical:true}),hit()]);
 assert.equal(combatImpactState(run).count,1);assert.notDeepEqual(combatImpactShake(run),{x:0,y:0});
 advanceCombatImpacts(run,room,.08,[hit(1,{newHit:false})]);
 assert.equal(combatImpactFilter(run,{id:1}),null);
 for(let i=0;i<5;i++)advanceCombatImpacts(run,room,.1,Array.from({length:50},(_,id)=>hit(id)));
 assert.ok(combatImpactState(run).count<=16);
 resetCombatImpacts(run);advanceCombatImpacts(run,room,.01,[hit(0,{critical:true}),...Array.from({length:40},(_,id)=>hit(id+1))]);
 assert.ok(combatImpactFilter(run,{id:0}));
});

test('reduced effects and shadow bodies suppress flash and shake; room/load discard contacts',()=>{
 const run={},room={};advanceCombatImpacts(run,room,.01,[hit(1,{critical:true})]);
 assert.equal(combatImpactFilter(run,{id:1},{reduced:true}),null);
 assert.equal(combatImpactFilter(run,{id:1,shadowBoss:1}),null);
 assert.deepEqual(combatImpactShake(run,{reduced:true}),{x:0,y:0});
 advanceCombatImpacts(run,{},.01,[]);assert.equal(combatImpactState(run).count,0);
 resetCombatImpacts(run);assert.equal(combatImpactState(run),null);
});

test('existing elemental contacts retain their sparks instead of doubling fallback particles',()=>{
 const run={},room={},c=context();advanceCombatImpacts(run,room,.01,[hit()],[{hitElement:'fire',x:400,y:250}]);
 drawCombatImpacts(c,run);assert.equal(c.calls.length,0);
 resetCombatImpacts(run);advanceCombatImpacts(run,room,.01,[hit()]);drawCombatImpacts(c,run);
 assert.equal(c.calls.length,4);
});

test('boss celebration rejects split and shadow deaths and never mutates reward state',()=>{
 const run={elapsed:2},room={xpDrops:[{id:0,burst:'boss',born:2,x:410,y:260,value:9}]};
 assert.equal(startBossClear(run,room,{split:true}),false);
 assert.equal(startBossClear(run,room,{shadowBoss:1}),false);
 assert.equal(startBossClear(run,room,{x:400,y:250,king:true}),true);
 const before=JSON.stringify({run,room});assert.equal(bossClearPhase(run),'impact');
 assert.notDeepEqual(bossClearShake(run),{x:0,y:0});assert.deepEqual(bossClearShake(run,{reduced:true}),{x:0,y:0});
 for(let i=0;i<8;i++)advanceBossClear(run,room,.1);assert.equal(bossClearPhase(run),'reward');
 const state=bossClearState(run),c=context();drawBossClear(c,run,room,{combatActive:true});
 assert.equal(c.calls.some(a=>a[0]==='label'),false);assert.deepEqual(bossClearState(run),state);
 assert.equal(JSON.stringify({run,room}),before);
 for(let i=0;i<11;i++)advanceBossClear(run,room,.1);assert.equal(bossClearPhase(run),null);
 assert.equal(drawBossClear(c,run,room),false);
});

test('boss reward shafts never mark absent or already attracted XP',()=>{
 const run={elapsed:2},room={xpDrops:[{id:0,burst:'boss',born:2,x:410,y:260,value:9}]};startBossClear(run,room);
 for(let i=0;i<11;i++)advanceBossClear(run,room,.1);
 const c=context();drawBossClear(c,run,room,{combatActive:true});assert.equal(c.calls.filter(a=>a[0]==='box').length,2);
 room.xpDrops[0].attract=true;const d=context();drawBossClear(d,run,room,{combatActive:true});assert.equal(d.calls.length,0);
 room.xpDrops=[];const e=context();drawBossClear(e,run,room,{combatActive:true});assert.equal(e.calls.length,0);
});

test('boss audio follows presentation phases once and skipped or stale cues never burst on resume',()=>{
 const run={},room={};startBossClear(run,room);
 assert.deepEqual(takeBossClearCues(run),['bossImpact']);assert.deepEqual(takeBossClearCues(run),[]);
 advanceBossClear(run,room,.1);advanceBossClear(run,room,.09);assert.deepEqual(takeBossClearCues(run),['bossBreak']);
 for(let i=0;i<6;i++)advanceBossClear(run,room,.1);assert.deepEqual(takeBossClearCues(run),['bossRelease']);
 assert.equal(bossClearState(run,{}),null);skipBossClear(run);assert.deepEqual(takeBossClearCues(run),[]);assert.equal(bossClearPhase(run),null);
 const late={};startBossClear(late,room);for(let i=0;i<14;i++)advanceBossClear(late,room,.1);
 assert.deepEqual(takeBossClearCues(late),[]);
});
