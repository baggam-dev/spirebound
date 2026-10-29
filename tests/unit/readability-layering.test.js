import test from 'node:test';
import assert from 'node:assert/strict';
import {drawHazardContours} from '../../src/rendering/threat-contours.js';
import {drawElements} from '../../src/combat/elements.js';
import {drawHighFloorGround} from '../../src/rendering/high-floor-vfx.js';
import {drawUpperThreatContours} from '../../src/rendering/upper-visuals.js';
function recorder(){const calls=[],state={globalAlpha:1,lineWidth:1,strokeStyle:'#fff'};const c=new Proxy(state,{get:(t,k)=>k in t?t[k]:k==='createRadialGradient'?(...a)=>{calls.push([k,...a]);return {addColorStop:(...b)=>calls.push(['stop',...b])};}:(...a)=>calls.push([k,...a]),set:(t,k,v)=>(t[k]=v,true)});return {c,calls};}

test('all live field contours keep their real radii and warning/active styles without mutating hazards',()=>{
 const room={hazards:Array.from({length:30},(_,i)=>({x:100+i*3,y:200,r:40+i,phase:i%2?'warning':'active'}))},before=JSON.stringify(room),{c,calls}=recorder();
 drawHazardContours(c,room);const clips=calls.filter(a=>a[0]==='arc'&&Number.isInteger(a[3]));assert.equal(clips.length,30);assert.deepEqual(clips.map(a=>a[3]),room.hazards.map(h=>h.r));assert.equal(JSON.stringify(room),before);assert.equal(calls.filter(a=>a[0]==='fill').length,0);
});
test('reduced ally ground rendering is static while normal ground continues to animate',()=>{
 const room={fireZones:[{x:200,y:200,r:80}],enemies:[{x:300,y:200,poisonRadius:60,poisonStacks:[{},{}]}]},before=JSON.stringify(room);
 const render=(time,reduced)=>{const {c,calls}=recorder();drawElements(c,room,time,reduced);return calls;};
 assert.deepEqual(render(1,true),render(9,true));assert.notDeepEqual(render(1,false),render(9,false));assert.ok(render(1,true).filter(a=>a[0]==='fillRect').length<render(1,false).filter(a=>a[0]==='fillRect').length);assert.equal(JSON.stringify(room),before);
});
test('late high-floor contours reuse thrust and gravity geometry without another fill or particles',()=>{
 for(const a of [{kind:'thrust',stage:'windup',aim:0,time:.2},{kind:'gravity',stage:'channel',time:.4,tx:450,ty:250}]){
  const e={type:'royalGuard',hp:1,x:300,y:250,highAttack:a},room={enemies:[e],obstacles:[]},before=JSON.stringify(room),{c,calls}=recorder();
  drawHighFloorGround(c,e,room,{outlineOnly:true});assert.equal(calls.filter(a=>['fill','fillRect','fillText'].includes(a[0])).length,0);assert.equal(JSON.stringify(room),before);
  if(a.kind==='gravity')assert.ok(calls.some(a=>a[0]==='arc'&&a[3]===90));else assert.ok(calls.some(a=>a[0]==='roundRect'&&a[3]===155));
 }
});
test('late Kald slash and dash contours neither replay hits nor paint a second filled area',()=>{
 for(const kind of ['slash','dash']){const e={type:'starKnight',gateTitle:'칼드',hp:1,x:300,y:250,darkAttack:{kind,x:300,y:250,tx:500,ty:250,aim:0,time:.2}},before=JSON.stringify(e),{c,calls}=recorder();drawUpperThreatContours(c,e);assert.equal(calls.filter(a=>a[0]==='fill').length,0);assert.equal(JSON.stringify(e),before);}
});
