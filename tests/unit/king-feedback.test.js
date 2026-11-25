import test from 'node:test';
import assert from 'node:assert/strict';
import {startUpperAttack,updateUpper,tickUpperState,fanOffsets} from '../../src/combat/upper-floors.js';
test('king first phase fires two five-arrow rows with locked aim and staggered angles',()=>{
 const e={id:0,type:'boss',variant:'king',hp:100,max:100,x:200,y:200},p={x:500,y:200},r={enemies:[e],obstacles:[]},b=[];
 startUpperAttack(e,'fan',p,r);updateUpper(e,p,r,.85,b,()=>{});assert.equal(b.length,5);const next=fanOffsets(e),copy=structuredClone(e),other=[];
 updateUpper(e,{x:700,y:450},r,.27,b,()=>{});assert.equal(b.length,5);updateUpper(e,p,r,.01,b,()=>{});assert.equal(b.length,10);assert.equal(e.cd,.63);
 updateUpper(copy,p,{...r,enemies:[copy]},.28,other,()=>{});assert.deepEqual(other,b.slice(5));b.slice(5).forEach((v,i)=>assert.ok(Math.abs(Math.atan2(v.vy,v.vx)-next[i])<1e-9));
});
test('king summons paired skeletons with one elite per wave up to phase-two cap',()=>{
 const e={id:0,type:'boss',variant:'king',hp:50,max:100,x:200,y:200,kingStage:2},p={x:500,y:250},r={enemies:[e],obstacles:[]};
 for(let i=0;i<400;i++)tickUpperState(e,p,r,.1,[],()=>.1);
 const summoned=r.enemies.filter(n=>n.summoned);assert.equal(summoned.length,6);assert.equal(summoned.filter(n=>n.elite).length,3);assert.equal(summoned.filter(n=>n.type==='skeletonWarrior').length,3);assert.equal(summoned.filter(n=>n.type==='skeletonArcher').length,3);
 assert.ok(summoned.every(n=>n.summoner===0&&n.spawnGrace===.6));
});
