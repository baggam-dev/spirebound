import test from 'node:test';
import assert from 'node:assert/strict';
import {criticalFeedback,limitCriticalFeedback,drawCriticalBurst} from '../../src/rendering/critical-feedback.js';
import {combatHitCue} from '../../src/ui/combat-audio.js';
import {displayedStats} from '../../src/ui/hud.js';
import {applyPlayerDamage,migrateCriticalCombat} from '../../src/combat/critical.js';
import {newRun} from '../../src/game/engine.js';

const hit=(extra={})=>({applied:true,critical:true,newHit:true,damage:15,enemyId:1,attackId:2,x:300,y:200,...extra});
test('critical accents require a real new damaging hit; ongoing ticks and blocked hits are quiet',()=>{
 assert.equal(criticalFeedback([hit(),hit(),hit({newHit:false}),hit({applied:false}),hit({damage:0}),hit({critical:false})]).length,1);
 assert.equal(combatHitCue(criticalFeedback([hit()])),'criticalHit');
});
test('weak point and critical use one label and one contact cue only for the matching attack',()=>{
 const weak={precisionBurst:true,attackId:2,text:'약점!',x:300,y:172};
 assert.deepEqual(criticalFeedback([hit()],[weak]),[]);assert.equal(weak.text,'약점 치명!');assert.equal(combatHitCue([weak]),'criticalHit');
 const other={precisionBurst:true,attackId:3,text:'약점!'};assert.equal(criticalFeedback([hit()],[other]).length,1);assert.equal(other.text,'약점!');
});
test('density limits preserve ordinary effects and bound new and live critical labels',()=>{
 const created=criticalFeedback(Array.from({length:30},(_,i)=>hit({attackId:i,enemyId:i})));assert.equal(created.length,6);
 const ordinary={text:'회복'},all=limitCriticalFeedback([...created,...created,...created,ordinary]);assert.equal(all.filter(f=>f.criticalBurst).length,12);assert.ok(all.includes(ordinary));
});
test('lethal damage keeps its impact coordinates after the enemy is removed',()=>{
 const s=newRun(101);migrateCriticalCombat(s);s.player.critChance=.5;s.critical.randomState=0;
 const e={id:1,hp:1,x:400,y:240};const damage=applyPlayerDamage(s,e,20);
 assert.ok(e.hp<0);assert.deepEqual(criticalFeedback([damage]).map(f=>[f.x,f.y]),[[400,212]]);
});
test('rendering normal and reduced critical contacts leaves the combat state untouched',()=>{
 const f=criticalFeedback([hit()])[0],before=JSON.stringify(f),calls=[];
 const c=new Proxy({globalAlpha:1},{get:(t,k)=>k in t?t[k]:(...args)=>calls.push([k,...args]),set:(t,k,v)=>(t[k]=v,true)});
 drawCriticalBurst(c,f,false);const normal=calls.filter(c=>c[0]==='fill').length;calls.length=0;drawCriticalBurst(c,f,true);
 assert.ok(normal>calls.filter(c=>c[0]==='fill').length);assert.equal(JSON.stringify(f),before);
});
test('stat readout uses effective critical caps and legacy defaults',()=>{
 const s=newRun(102),p=s.player;assert.equal(displayedStats(p).criticalChance,.05);assert.equal(displayedStats(p).criticalMultiplier,1.5);
 p.critChance=3;p.critMultiplier=9;assert.equal(displayedStats(p).criticalChance,.5);assert.equal(displayedStats(p).criticalMultiplier,2.5);
});
