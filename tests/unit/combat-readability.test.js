import test from 'node:test';
import assert from 'node:assert/strict';
import {readableEffects,drawCombatLabels} from '../../src/combat/combat-readability.js';
test('mobile blasts and elemental contacts survive newer ordinary hits without increasing the budget',()=>{
 const blast=Object.freeze({playerBlast:'fire',x:20,y:20}),element=Object.freeze({hitElement:'frost',x:80,y:20});
 const arrows=Array.from({length:30},(_,i)=>Object.freeze({arrowImpact:true,x:i*50,y:100}));
 const glints=Array.from({length:30},(_,i)=>Object.freeze({enemyFeedback:'hit',x:i*50,y:200}));
 const effects=Object.freeze([blast,element,...arrows,...glints]),before=JSON.stringify(effects),visible=readableEffects(effects,true);
 assert.equal(visible.length,16);assert.ok(visible.includes(blast)&&visible.includes(element));assert.equal(visible.filter(f=>f.arrowImpact).length,14);assert.equal(visible.some(f=>f.enemyFeedback==='hit'),false);
 assert.deepEqual(visible,[blast,element,...arrows.slice(-14)]);assert.equal(JSON.stringify(effects),before);
});
test('mobile priority selection deduplicates within each contact family and retains mixed important effects',()=>{
 const old={hitElement:'fire',x:1,y:1},latest={...old},blast={playerBlast:'fire',x:1,y:1};
 const important=[{text:'약점!',hitElement:'fire'},{enemyFeedback:'death',hitElement:'fire'},{thunder:true,hitElement:'chain'}];
 const effects=[old,blast,latest,...important];assert.deepEqual(readableEffects(effects,true),[blast,latest,...important]);assert.equal(readableEffects(effects,false),effects);
});
test('compact multishot contacts share the accent budget while precision and warnings survive',()=>{
 const arrows=Array.from({length:40},(_,i)=>Object.freeze({arrowImpact:true,x:i*50,y:100}));
 const important=[{arrowImpact:true,precision:true},{precisionBurst:true,text:'약점!'},{thunder:true},{enemyFeedback:'death'}].map(Object.freeze);
 const all=Object.freeze([...important,...arrows]),before=JSON.stringify(all),result=readableEffects(all,true);
 assert.equal(result.filter(f=>f.arrowImpact&&!f.precision).length,16);for(const f of important)assert.ok(result.includes(f));assert.equal(JSON.stringify(all),before);
 assert.equal(readableEffects(all,false),all);
});
test('compact rendering keeps critical feedback while bounding crowded accents',()=>{
 const important=[{text:'-1',hitSource:'boss'},{thunder:true},{enemyFeedback:'death'},{slash:true}];
 const accents=Array.from({length:40},(_,i)=>Object.freeze({x:i*50,y:90,hitElement:'fire'}));
 const all=Object.freeze([...accents,...important]);const compact=readableEffects(all,true);
 assert.equal(compact.length,20);for(const f of important)assert.ok(compact.includes(f));assert.equal(readableEffects(all,false),all);
 const duplicate={x:1,y:1,hitElement:'fire'};assert.deepEqual(readableEffects([{...duplicate},duplicate],true),[duplicate]);
});
test('mobile pickup labels stay separated at the lower screen edge without moving inputs',()=>{
 const positions=[],c={save(){},restore(){},measureText(){return {width:120};},strokeText(){},fillText(t,x,y){positions.push({x,y});}};
 const labels=Object.freeze(Array.from({length:5},(_,i)=>Object.freeze({text:`essence ${i}`,x:955,y:460,t:1,essencePickup:true})));
 drawCombatLabels(c,labels,true);assert.equal(new Set(positions.map(p=>p.y)).size,5);assert.ok(positions.every(p=>p.y<=485&&p.x<=892));assert.equal(labels[0].x,955);
});
