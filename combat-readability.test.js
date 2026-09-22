import test from 'node:test';
import assert from 'node:assert/strict';
import {readableEffects,drawCombatLabels} from './combat-readability.js';
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
