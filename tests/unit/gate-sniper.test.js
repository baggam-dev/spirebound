import test from 'node:test';
import assert from 'node:assert/strict';
import {startUpperAttack,updateUpper,fanOffsets} from '../../src/combat/upper-floors.js';
const setup=()=>{const e={id:1,type:'astralSniper',gateTitle:'Vera',x:650,y:200,hp:100,max:100,cd:1},p={x:400,y:270};return {e,p,r:{enemies:[e],obstacles:[]}};};

test('Vera has separately warned five-four-one volleys and ends with the new recovery',()=>{
 const {e,p,r}=setup(),bullets=[];startUpperAttack(e,'fan',p,r);
 for(const [step,count] of [[0,5],[1,9],[2,10]]){
  assert.equal(e.darkAttack.step,step);const remaining=e.darkAttack.time;updateUpper(e,p,r,remaining-.01,bullets,()=>{});assert.equal(bullets.length,step===0?0:step===1?5:9);
  updateUpper(e,p,r,.011,bullets,()=>{});assert.equal(bullets.length,count);
 }
 assert.equal(e.darkAttack,undefined);assert.equal(e.cd,.5);
});
test('gate archer moves while preparing then locks origin and aim for final 0.3 seconds',()=>{
 const {e,p,r}=setup(),b=[];startUpperAttack(e,'fan',p,r);updateUpper(e,p,r,.4,b,()=>{});assert.notEqual(e.x,650);assert.equal(b.length,0);
 const {x,y}=e,aim=e.darkAttack.aim;assert.equal(e.darkAttack.x,x);assert.equal(e.darkAttack.y,y);
 updateUpper(e,{x:800,y:400},r,.29,b,()=>{});assert.equal(e.x,x);assert.equal(e.y,y);assert.equal(e.darkAttack.aim,aim);assert.equal(b.length,0);
 updateUpper(e,p,r,.02,b,()=>{});assert.equal(b.length,5);b.forEach((v,i)=>{assert.equal(v.x,x);assert.equal(v.y,y);assert.ok(Math.abs(Math.atan2(Math.sin(Math.atan2(v.vy,v.vx)-aim-fanOffsets(e,{step:0})[i]),Math.cos(Math.atan2(v.vy,v.vx)-aim-fanOffsets(e,{step:0})[i])))<1e-9);});
});
test('ordinary snipers reposition; gate movement obeys freeze, opening and slow',()=>{
 for(const status of [{frozen:1},{opening:1}]){const {e,p,r}=setup();Object.assign(e,status);updateUpper(e,p,r,.1,[],()=>{});assert.equal(e.x,650);assert.equal(e.y,200);}
 const normal=setup();delete normal.e.gateTitle;updateUpper(normal.e,normal.p,normal.r,.1,[],()=>{});assert.notEqual(normal.e.x,650);
 const fast=setup(),slow=setup();slow.e.slow=1;slow.e.slowFactor=.5;for(const s of [fast,slow])updateUpper(s.e,s.p,s.r,.1,[],()=>{});assert.ok(Math.abs(Math.hypot(fast.e.x-650,fast.e.y-200)-2*Math.hypot(slow.e.x-650,slow.e.y-200))<1e-9);
});
