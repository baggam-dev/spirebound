import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,currentRoom} from '../../src/game/engine.js';
import {castUltimate,tickRain} from '../../src/combat/abilities.js';
import {drawArrowRain,drawCrossbow,drawCrossbowEnding} from '../../src/rendering/ultimate-visuals.js';
import {drawImpactAccent,drawArrowImpact} from '../../src/rendering/arrow-impact-visuals.js';
import {crossbowArtReady,crossbowArtState} from '../../src/rendering/crossbow-art.js';
function canvas(){
 const calls=[],stack=[],c={globalAlpha:.4,calls};c.save=()=>stack.push(c.globalAlpha);c.restore=()=>{c.globalAlpha=stack.pop();};
 for(const op of ['beginPath','closePath','rect','clip','translate','rotate','moveTo','lineTo','stroke','fill','fillRect','arc','drawImage'])c[op]=(...args)=>{assert.ok(args.every(a=>typeof a!=='number'||Number.isFinite(a)),op);assert.ok(c.globalAlpha>=0&&c.globalAlpha<=.4,op);calls.push({op,args,alpha:c.globalAlpha});};
 return c;
}
test('rain graphics stay pure at all six real damage pulses and retain the real clip in both modes',()=>{
 const s=newRun(31);s.player.ultimate=1;s.player.evolutions={ultimate:'burst'};castUltimate(s);const r=currentRoom(s);
 for(let i=0;i<6;i++){
  if(i)tickRain(s,.3);const before=JSON.stringify(s),z=Object.freeze({...r.arrowRain}),normal=canvas(),reduced=canvas();
  drawArrowRain(normal,z);drawArrowRain(reduced,z,true);assert.equal(JSON.stringify(s),before);assert.equal(normal.globalAlpha,.4);assert.equal(reduced.globalAlpha,.4);
  assert.ok(normal.calls.some(c=>c.op==='arc'&&c.args[2]===280));assert.ok(reduced.calls.some(c=>c.op==='fill'));assert.ok(reduced.calls.length<normal.calls.length);
  const paused=canvas();drawArrowRain(paused,z);assert.deepEqual(paused.calls,normal.calls);
 }
 const expired=canvas();drawArrowRain(expired,{x:480,y:270,r:280,elapsed:1.8,pulses:6});assert.equal(expired.calls.length,0);
});
test('missing optional crossbow art keeps a finite, opacity-safe vector fallback for every aim',async()=>{
 assert.equal(await crossbowArtReady,true);assert.equal(crossbowArtState().ready,false);
 for(const aim of [0,Math.PI/2,Math.PI,-Math.PI/2])for(const reduced of [false,true]){
  const t=Object.freeze({x:480,y:270,time:13.95,clock:.6,aim,build:{frost:1}}),before=JSON.stringify(t),c=canvas();drawCrossbow(c,t,reduced);assert.ok(c.calls.some(c=>c.op==='stroke'));assert.equal(c.globalAlpha,.4);assert.equal(JSON.stringify(t),before);
  const ending=canvas();drawCrossbowEnding(ending,{...t,time:.2},reduced);assert.ok(ending.calls.length>0);assert.equal(ending.globalAlpha,.4);
 }
});
test('contact weights preserve frozen effects, pause determinism, incoming opacity and reduced cores',()=>{
 for(const strength of [0,1,2]){
  const effect=Object.freeze({x:300,y:200,age:.02,angle:Math.PI/2,strength}),normal=canvas(),reduced=canvas();drawImpactAccent(normal,effect);drawImpactAccent(reduced,{...effect,reduced:true});
  assert.ok(reduced.calls.some(c=>c.op==='fill'));assert.ok(reduced.calls.length<normal.calls.length);assert.equal(normal.globalAlpha,.4);const paused=canvas();drawImpactAccent(paused,effect);assert.deepEqual(paused.calls,normal.calls);
 }
 const expired=canvas();assert.equal(drawArrowImpact(expired,{arrowImpact:true,x:300,y:200,t:0,duration:.2}),true);assert.equal(expired.calls.length,0);
});
