import test from 'node:test';
import assert from 'node:assert/strict';
import {fanOffsets,startUpperAttack,updateUpper} from './upper-floors.js';
test('upper ordinary archers fire two ascent arrows and three return arrows on the telegraphed angles',()=>{
 for(const tier of [6,7])for(const escapeDepth of [0,1,2]){
  const e={id:1,type:'astralSniper',tier,escapeDepth,x:200,y:200,hp:100,max:100},p={x:500,y:200},r={enemies:[e],obstacles:[]},bullets=[];
  startUpperAttack(e,'fan',p,r);const offsets=fanOffsets(e);assert.equal(offsets.length,escapeDepth?3:2);
  updateUpper(e,p,r,.59,bullets,()=>{});assert.equal(bullets.length,0);
  updateUpper(e,{x:500,y:350},r,.02,bullets,()=>{});assert.equal(bullets.length,offsets.length);
  bullets.forEach((b,i)=>{assert.ok(Math.abs(Math.atan2(b.vy,b.vx)-offsets[i])<1e-10);assert.equal(b.damage,9);});assert.equal(e.cd,1.1);
 }
});
test('gate archer and king fan patterns retain their current counts',()=>{
 assert.equal(fanOffsets({type:'astralSniper',gateTitle:'Vera'}).length,5);
 assert.equal(fanOffsets({variant:'king',hp:100,max:100}).length,5);
 assert.equal(fanOffsets({variant:'king',hp:50,max:100}).length,5);
});
