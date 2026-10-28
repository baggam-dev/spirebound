import test from 'node:test';
import assert from 'node:assert/strict';
import {assetPlanFiles,floorAssetPlan,portraitAssetPlan} from '../../src/rendering/asset-packs.js';
import {veraPoseIndex,VERA_BODY_HEIGHT} from '../../src/rendering/vera-sprite.js';
import {drawVeraArrow,drawVeraSigil} from '../../src/rendering/vera-effects.js';
import {startUpperAttack,updateUpper} from '../../src/combat/upper-floors.js';

test('Vera art is prepared for the actual gate and isolated portrait without first-floor overhead',()=>{
 const file='vera-royal-eye-atlas-v1.png';
 assert.equal(assetPlanFiles(floorAssetPlan(0)).includes(file),false);
 assert.equal(assetPlanFiles(floorAssetPlan(6)).includes(file),true);
 assert.equal(assetPlanFiles(floorAssetPlan(0,{enemies:['vera']})).includes(file),true);
 assert.deepEqual(assetPlanFiles(portraitAssetPlan('vera')),[file]);
 assert.equal(assetPlanFiles(portraitAssetPlan('kald')).includes(file),false);
 assert.equal(VERA_BODY_HEIGHT,69.6);
});

test('existing aim, release and elite recovery select poses without changing saved attack clocks',()=>{
 const e={type:'astralSniper',gateTitle:'베라',darkAttack:{kind:'fan',time:.4,aim:0}},before=JSON.stringify(e);
 assert.equal(veraPoseIndex(e),1);assert.equal(veraPoseIndex(e,{staticPose:true}),0);assert.equal(JSON.stringify(e),before);
 assert.equal(veraPoseIndex({...e,darkFlash:{time:.1}}),2);
 assert.equal(veraPoseIndex({elite:'volley',opening:1.2,eliteCooldown:2.9}),2);
 assert.equal(veraPoseIndex({elite:'volley',opening:.5,eliteCooldown:2}),0);
});

test('separate effects are read-only and do not restyle ordinary or friendly projectiles',()=>{
 const c=new Proxy({},{get:(t,k)=>k in t?t[k]:(()=>{}),set:(t,k,v)=>(t[k]=v,true)}),e={type:'astralSniper',gateTitle:'베라',hp:1,x:300,y:250,darkAttack:{kind:'fan',time:.4}},b={enemy:true,source:'별의 눈, 베라 별빛 화살',vx:330,vy:0,life:2},before=JSON.stringify({e,b});
 assert.equal(drawVeraSigil(c,e,2),true);assert.equal(drawVeraSigil(c,{...e,gateTitle:undefined},2),false);assert.equal(drawVeraSigil(c,e,2,{staticPose:true}),false);
 assert.equal(drawVeraArrow(c,b,2),true);assert.equal(drawVeraArrow(c,{...b,source:'별자리 저격수 별빛 화살'},2),false);assert.equal(drawVeraArrow(c,{...b,enemy:false},2),false);
 assert.equal(JSON.stringify({e,b}),before);
});

test('Vera keeps the five-shot fan and ordinary snipers retain their original source label',()=>{
 for(const named of [false,true]){
  const e={id:1,type:'astralSniper',hp:100,max:100,x:300,y:270,cd:0,...(named?{gateTitle:'베라'}:{})},p={x:600,y:270},room={enemies:[e],obstacles:[]},shots=[];
  startUpperAttack(e,'fan',p,room);updateUpper(e,p,room,.6,shots,()=>{});
  assert.equal(shots.length,named?5:2);assert.ok(shots.every(b=>b.damage===9&&b.dark&&b.source===(named?'별의 눈, 베라 별빛 화살':'별자리 저격수 별빛 화살')));
 }
});
