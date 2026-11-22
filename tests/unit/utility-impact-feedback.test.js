import test from 'node:test';
import assert from 'node:assert/strict';
import {utilityImpactFeedback,utilityImpactCues} from '../../src/rendering/utility-impact-feedback.js';
import {limitUtilityEffects,drawUtilityEffect} from '../../src/rendering/utility-effects.js';
import {newRun,currentRoom} from '../../src/game/engine.js';
import {castUtility} from '../../src/combat/utility.js';
import {tickUtilityCast} from '../../src/combat/utility-expansion.js';
import {drainDamageResults} from '../../src/combat/critical.js';
const hit=(extra={})=>({source:'frostWave',enemyId:1,attackId:3,applied:true,newHit:true,damage:20,critical:false,x:200,y:200,...extra});
test('real frost resolution gives feedback only for the target actually damaged and never replays on an empty step',()=>{
 const s=newRun(85);s.player.level=6;s.player.utility='frostWave';s.player.critChance=0;
 const r=currentRoom(s),p=s.player;r.obstacles=[];
 r.enemies=[{id:0,type:'archer',x:p.x+50,y:p.y,hp:500,max:500},{id:1,type:'archer',x:p.x+70,y:p.y,hp:500,max:500,phase:'air'}];
 assert.equal(castUtility(s),'frostWave');const effects=[];tickUtilityCast(s,r,0,effects);const packets=drainDamageResults(s),before=JSON.stringify(s);
 assert.ok(r.enemies[0].hp<500);assert.equal(r.enemies[1].hp,500);assert.equal(utilityImpactFeedback(packets,effects).length,1);
 assert.deepEqual(utilityImpactCues(packets,effects),['utilityFrostHit']);assert.deepEqual(utilityImpactFeedback(drainDamageResults(s),[]),[]);
 assert.equal(JSON.stringify(s),before);
});
test('only fresh successful utility damage emits a contact; critical contacts stay with critical feedback',()=>{
 const invalid=[hit({applied:false}),hit({damage:0}),hit({newHit:false}),hit({source:'arrow'}),hit({x:NaN}),hit({critical:true})];
 assert.deepEqual(utilityImpactFeedback(invalid),[]);
 const frost=hit(),thunder=hit({source:'thunderSigil',enemyId:2,x:300}),out=utilityImpactFeedback([frost,frost,thunder]);
 assert.deepEqual(out.map(f=>f.utilityFx),['frostContact','sigilContact']);assert.equal(out[1].angle,-Math.PI/2);
});
test('contacts are bounded to four separated cells and prioritize meaningful hits without input writes',()=>{
 const hits=Array.from({length:20},(_,i)=>hit({enemyId:i,x:100+i*40,damage:i+1})),before=JSON.stringify(hits);
 const out=utilityImpactFeedback(hits);assert.equal(out.length,4);assert.equal(out[0].x,860);assert.equal(JSON.stringify(hits),before);
 assert.equal(utilityImpactFeedback([hit(),hit({enemyId:2,x:201})]).length,1);
});
test('landing, absorption and cast effects retain the twelve-slot utility budget before optional contacts',()=>{
 const primary=Array.from({length:12},(_,id)=>({utilityFx:id%2?'focusShot':'frostWave',id})),text={text:'damage'},contacts=utilityImpactFeedback([hit(),hit({x:300,enemyId:2})]);
 assert.deepEqual(limitUtilityEffects([text,...primary,...contacts]),[text,...primary]);
 const kept=limitUtilityEffects([...primary.slice(0,11),...contacts]);assert.equal(kept.filter(f=>f.utilityFx).length,12);assert.equal(kept.filter(f=>f.utilityContact).length,1);
});
test('skill cues are once per fresh event batch; empty frost, repeated damage and expired buffs stay silent',()=>{
 const fx=[{utilityFx:'galeBreak'},{utilityFx:'galeBreak'}];
 assert.deepEqual(utilityImpactCues([hit(),hit({enemyId:2}),hit({critical:true})],fx),['utilityFrostHit','utilityGaleBreak']);
 assert.deepEqual(utilityImpactCues([hit({applied:false}),hit({newHit:false})],[{utilityFx:'frostWave'},{utilityFx:'focusExpire'}]),[]);
 assert.deepEqual(utilityImpactCues([],[{utilityFx:'thunderSigil'}]),['utilityThunderHit']);
 assert.deepEqual(utilityImpactCues([],[]),[]);
});
test('reused contact rendering restores canvas state in normal and reduced modes',()=>{
 const stack=[],c=new Proxy({globalAlpha:.7,save(){stack.push(this.globalAlpha);},restore(){this.globalAlpha=stack.pop();}},{get:(o,k)=>k in o?o[k]:()=>{}});
 const effects=[...utilityImpactFeedback([hit(),hit({x:300,enemyId:2,source:'thunderSigil'})]),{utilityFx:'galeBreak',x:200,y:200,t:.25,duration:.25}];
 const before=JSON.stringify(effects);
 for(const reduced of [false,true])for(const f of effects){assert.equal(drawUtilityEffect(c,f,{reduced}),true);assert.equal(c.globalAlpha,.7);assert.equal(stack.length,0);}
 assert.equal(JSON.stringify(effects),before);
});
