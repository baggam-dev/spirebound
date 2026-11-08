import test from 'node:test';
import assert from 'node:assert/strict';
import {drawArrowImpact,drawPrecisionBurst,drawSlashRibbon} from '../../src/rendering/arrow-impact-visuals.js';
import {drawElementHit} from '../../src/rendering/element-hit-visuals.js';
import {hitEnemy} from '../../src/progression/progression.js';

// Canvas contract probe; real raster/overlap quality still requires browser QA.
function canvas(){
 const calls=[],stack=[],c={globalAlpha:.4,calls};
 c.save=()=>stack.push(c.globalAlpha);c.restore=()=>{c.globalAlpha=stack.pop();};
 for(const op of ['beginPath','closePath','rect','clip','translate','rotate','scale','moveTo','lineTo','stroke','fill','fillRect'])c[op]=(...args)=>{
  assert.ok(args.every(x=>typeof x!=='number'||Number.isFinite(x)),op);
  assert.ok(c.globalAlpha>=0&&c.globalAlpha<=.4,op);
  calls.push({op,args,alpha:c.globalAlpha});
 };
 return c;
}

test('contact renderers preserve frozen effects and incoming opacity in both modes',()=>{
 const cases=[
  [drawArrowImpact,{arrowImpact:true,x:200,y:200,angle:Math.PI/2,t:.16,duration:.2,precision:true}],
  ...['fire','frost','poison','chain'].map(hitElement=>[drawElementHit,{hitElement,x:200,y:200,angle:Math.PI/2,t:.16,duration:.3,level:3}]),
 ];
 for(const [draw,data] of cases){
  const effect=Object.freeze(data),before=JSON.stringify(effect),normal=canvas(),reduced=canvas();
  assert.equal(draw(normal,effect,false),true);assert.equal(draw(reduced,effect,true),true);
  assert.ok(reduced.calls.some(x=>['fillRect','fill','stroke'].includes(x.op)));
  assert.ok(reduced.calls.length<normal.calls.length);
  assert.equal(JSON.stringify(effect),before);assert.equal(normal.globalAlpha,.4);assert.equal(reduced.globalAlpha,.4);
 }
});

test('reduced chain retains its real endpoints without mutating target coordinates',()=>{
 const effect=Object.freeze({hitElement:'chain',x:120,y:180,toX:350,toY:260,t:.15,duration:.2,level:3,branch:'web'}),c=canvas();
 drawElementHit(c,effect,true);
 assert.ok(c.calls.some(x=>x.op==='moveTo'&&x.args[0]===0&&x.args[1]===0));
 assert.ok(c.calls.some(x=>x.op==='lineTo'&&x.args[0]===230&&x.args[1]===80));
 assert.equal(c.globalAlpha,.4);
});

test('precision accent follows the existing burst cadence and expires before its label',()=>{
 const p={damage:10,precision:1,evolutions:{},relics:[]},e={id:1,type:'chaser',x:200,y:200,hp:1000,max:1000};
 let burst;
 for(let i=0;i<3;i++){
  const effects=hitEnemy(p,e,[e],[],1,true,null,{x:100,y:200},{primary:true});
  burst=effects.find(f=>f.precisionBurst);assert.equal(!!burst,i===2);
 }
 assert.equal(burst.text,'약점!');assert.equal(burst.hitAngle,0);assert.equal(e.precisionHits,0);
 const live=canvas(),expired=canvas();drawPrecisionBurst(live,Object.freeze(burst),true);drawPrecisionBurst(expired,Object.freeze({...burst,t:.4}),true);
 assert.ok(live.calls.some(x=>x.op==='stroke'));assert.equal(expired.calls.length,0);
});

test('slash ribbon is deterministic, bounded by its radius, and has less decoration when reduced',()=>{
 const normal=canvas(),reduced=canvas();
 drawSlashRibbon(normal,33,.5);drawSlashRibbon(reduced,33,.5,{reduced:true});
 assert.ok(reduced.calls.length<normal.calls.length);
 for(const call of normal.calls.filter(x=>['moveTo','lineTo'].includes(x.op)))assert.ok(Math.hypot(...call.args)<=33+1e-9);
 const repeat=canvas();drawSlashRibbon(repeat,33,.5);assert.deepEqual(repeat.calls,normal.calls);
 assert.equal(normal.globalAlpha,.4);
});
