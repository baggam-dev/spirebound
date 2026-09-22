import test from 'node:test';
import assert from 'node:assert/strict';
import {tickBlasts} from './elites.js';
import {drawGroundField,drawAuraField} from './ground-visuals.js';
test('elite blast emits one burst at the unchanged damage time',()=>{
 const room={blasts:[{x:100,y:100,r:85,time:1,damage:18}],obstacles:[]},effects=[],hits=[];
 tickBlasts(room,.9,{x:100,y:100},n=>hits.push(n),effects);assert.equal(effects.length,0);assert.equal(hits.length,0);
 tickBlasts(room,.11,{x:100,y:100},n=>hits.push(n),effects);assert.deepEqual(hits,[18]);assert.equal(effects.length,1);assert.equal(effects[0].r,85);
 tickBlasts(room,1,{x:100,y:100},n=>hits.push(n),effects);assert.equal(effects.length,1);
});
test('ground fields preserve real radius and frozen input without randomness',()=>{
 const arcs=[],c={save(){},restore(){},setLineDash(){},beginPath(){},arc(x,y,r){arcs.push(r);},fill(){},stroke(){},clip(){},fillRect(){},moveTo(){},lineTo(){}};
 const z=Object.freeze({x:100,y:100,r:85,time:.4});for(const kind of ['fire','gas','hostile','warning','blast']){arcs.length=0;drawGroundField(c,z,kind,1);assert.equal(arcs[0],85);assert.ok(arcs.every(r=>r<=85));}
 arcs.length=0;drawAuraField(c,z,90,1,true);assert.equal(arcs[0],90);assert.ok(arcs.includes(27));
});
