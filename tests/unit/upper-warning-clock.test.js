import test from 'node:test';
import assert from 'node:assert/strict';
import {upperAttackWindup,upperAttackProgress} from '../../src/combat/boss-pressure.js';
import {startUpperAttack,updateUpper} from '../../src/combat/upper-floors.js';
import {kingWeaponMotion} from '../../src/rendering/boss-motion.js';

const king=(ratio=1,pressure=1)=>({id:0,type:'boss',variant:'king',hp:ratio*1000,max:1000,x:480,y:180,bossPressureVersion:pressure});
test('shared windups retain original first attack clocks across king phases and upper enemies',()=>{
 for(const [e,kind,expected] of [[king(),'dash',.85],[king(.5),'dash',.65],[king(.25),'dash',.45],
  [king(.25),'judgment',.8],[king(.25,0),'judgment',1.1],[king(.25),'slash',.32],[king(.5),'slash',.5],
  [{type:'astralSniper',hp:100,max:100},'fan',.6],[{type:'starKnight',hp:100,max:100,gateTitle:true},'slash',.25]]){
  const room={obstacles:[],enemies:[e]};startUpperAttack(e,kind,{x:700,y:350},room);
  assert.equal(e.darkAttack.time,expected);assert.equal(upperAttackProgress(e,e.darkAttack),0);
 }
 assert.equal(upperAttackWindup({type:'starKnight',gateTitle:true},'slash',{step:1}),.2);
});
test('each actual judgment warning restarts at zero and reaches halfway on its own combat clock',()=>{
 for(const pressure of [0,1]){
  const e=king(.25,pressure),p={x:900,y:480},room={obstacles:[],enemies:[e]};startUpperAttack(e,'judgment',p,room);
  for(let step=0;step<4;step++){
   const a=e.darkAttack,duration=step===0?(pressure?.8:1.1):(pressure?.42:.65);
   assert.equal(a.time,duration);assert.equal(upperAttackProgress(e,a),0);
   updateUpper(e,p,room,duration/2,[],()=>{});assert.ok(Math.abs(upperAttackProgress(e,a)-.5)<1e-10);
   updateUpper(e,p,room,duration/2,[],()=>{});
  }
  assert.equal(e.darkAttack.kind,'mark');assert.equal(e.darkAttack.finisher,true);
  assert.equal(e.darkAttack.time,pressure?.75:1.1);assert.equal(upperAttackProgress(e,e.darkAttack),0);
 }
});
test('king dash anticipation follows the full first phase clock without draw mutation or reduced motion lean',()=>{
 const e=king(),room={obstacles:[],enemies:[e]};startUpperAttack(e,'dash',{x:700,y:350},room);
 assert.ok(Math.abs(kingWeaponMotion(e).lean)<1e-10);e.darkAttack.time=.425;
 const before=JSON.stringify(e);assert.ok(Math.abs(kingWeaponMotion(e).lean+.009)<1e-10);
 assert.equal(kingWeaponMotion(e,{reduced:true}).lean,0);assert.equal(JSON.stringify(e),before);
 assert.equal(upperAttackProgress(e,{kind:'dash',time:2}),0);assert.equal(upperAttackProgress(e,{kind:'dash',time:-1}),1);
});
