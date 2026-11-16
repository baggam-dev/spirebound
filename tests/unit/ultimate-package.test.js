import test from 'node:test';
import assert from 'node:assert/strict';
import {drawImpactAccent,drawGroundContact} from '../../src/rendering/arrow-impact-visuals.js';
import {drawArrowRain,drawCrossbow,drawCrossbowRelease} from '../../src/rendering/ultimate-visuals.js';
function recorder(){
 const calls=[],stack=[],state={globalAlpha:.7,lineWidth:3,fillStyle:'#000',strokeStyle:'#fff',globalCompositeOperation:'lighter',lineCap:'round',lineJoin:'round',dash:[4,3]};
 const c=new Proxy(state,{get:(t,k)=>k in t?t[k]:k==='setLineDash'?v=>{t.dash=[...v];}:k==='save'?()=>stack.push({...t}):k==='restore'?()=>{const old=stack.pop();for(const key of Object.keys(t))delete t[key];Object.assign(t,old);}:(...args)=>calls.push({op:k,args,fill:t.fillStyle,stroke:t.strokeStyle,alpha:t.globalAlpha,composite:t.globalCompositeOperation,cap:t.lineCap,join:t.lineJoin,dash:[...t.dash]}),set:(t,k,v)=>(t[k]=v,true)});
 return {c,calls,state:()=>JSON.stringify(state)};
}
function solidContacts(calls){for(const v of calls.filter(v=>['fill','fillRect','stroke'].includes(v.op))){assert.equal(v.composite,'source-over');assert.equal(v.cap,'butt');assert.equal(v.join,'miter');assert.deepEqual(v.dash,[]);}}
test('rain keeps three focal contacts in both modes and restores Canvas without changing pulse state',()=>{
 const z=Object.freeze({x:480,y:300,r:180,elapsed:.02,pulses:1});
 for(const reduced of [false,true]){
  const {c,calls,state}=recorder(),before=state();drawArrowRain(c,z,reduced);
  assert.equal(calls.filter(v=>v.op==='fill'&&v.fill==='#3b2c24').length,3);
  assert.ok(calls.some(v=>v.op==='arc'&&v.args[2]===180));assert.equal(state(),before);
  solidContacts(calls);
 }
});
test('contact weights remain distinct and reduced mode limits debris while restoring draw state',()=>{
 const weights=[];
 for(const strength of [0,1,2]){
  const regular=recorder(),reduced=recorder(),a=regular.state(),b=reduced.state();
  drawImpactAccent(regular.c,{x:480,y:300,age:.02,angle:.7,strength});
  drawImpactAccent(reduced.c,{x:480,y:300,age:.02,angle:.7,strength,reduced:true});
  const count=r=>r.calls.filter(v=>v.op==='fill').length;weights.push(count(regular));
  assert.ok(count(reduced)<count(regular));assert.equal(regular.state(),a);assert.equal(reduced.state(),b);
  solidContacts(regular.calls);solidContacts(reduced.calls);
  assert.ok(regular.calls.some(v=>v.op==='rotate'&&v.args[0]===.7));
 }
 assert.ok(weights[0]<weights[1]&&weights[1]<weights[2]);
 const {c,calls,state}=recorder(),before=state();drawGroundContact(c,{x:480,y:300,age:.1});assert.equal(state(),before);assert.equal(calls.filter(v=>v.op==='fill').length,6);
});
test('crossbow launch light requires actual recoil and fallback drawing preserves the turret and Canvas',()=>{
 const idle=recorder();drawCrossbowRelease(idle.c,{recoil:0});assert.equal(idle.calls.length,0);
 for(const reduced of [false,true]){
  const {c,state,calls}=recorder(),before=state(),t=Object.freeze({x:480,y:300,time:12,clock:.6,aim:Math.PI/4});
  drawCrossbow(c,t,reduced);assert.equal(state(),before);assert.ok(calls.some(v=>v.op==='stroke'&&v.stroke==='#fff0ce'));
  solidContacts(calls);
 }
});
