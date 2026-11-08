import test from 'node:test';
import assert from 'node:assert/strict';
import {drawPlayerBlast} from '../../src/rendering/skill-burst-art.js';
import {drawBurst,drawGroundField} from '../../src/rendering/ground-visuals.js';
import {drawSkillTrail} from '../../src/rendering/skill-visuals.js';
import {drawXpPickup} from '../../src/rendering/xp-shards.js';
import {emitInteraction,drawInteractionEffects} from '../../src/rendering/interaction-visuals.js';
function context(){
 const c={globalAlpha:.3,calls:[]},stack=[];
 c.save=()=>stack.push(c.globalAlpha);c.restore=()=>{c.globalAlpha=stack.pop();};
 for(const op of ['beginPath','closePath','arc','ellipse','rect','clip','translate','rotate','scale','moveTo','lineTo','stroke','fill','fillRect','setLineDash','fillText'])c[op]=(...args)=>{assert.ok(c.globalAlpha<=.3&&c.globalAlpha>=0,op);assert.ok(args.every(v=>typeof v!=='number'||Number.isFinite(v)),op);c.calls.push({op,args,alpha:c.globalAlpha});};
 c.createRadialGradient=()=>({addColorStop(){}});return c;
}
test('ally bursts respect inherited opacity and disappear at their real lifetime',()=>{
 for(const draw of [drawPlayerBlast,drawBurst])for(const reduced of [false,true]){
  const c=context(),f=Object.freeze({playerBlast:'fire',groundBurst:true,x:400,y:200,r:70,t:.15,duration:.3,color:'#96ff72'});
  draw(c,f,reduced);assert.ok(c.calls.some(x=>x.op==='fillRect'||x.op==='fill'));assert.equal(c.globalAlpha,.3);
  c.calls.length=0;draw(c,{...f,t:0},reduced);assert.equal(c.calls.length,0);
 }
});
test('ally fields and trails preserve frozen inputs, opacity and reduced identity',()=>{
 const z=Object.freeze({x:400,y:200,r:85,time:.1}),p=Object.freeze({fire:3,evolutions:Object.freeze({fire:'ember'})});
 for(const kind of ['fire','gas'])for(const reduced of [false,true]){const c=context();drawGroundField(c,z,kind,2,reduced);assert.equal(c.globalAlpha,.3);assert.ok(c.calls.some(x=>x.op==='fillRect'));}
 const normal=context(),reduced=context();drawSkillTrail(normal,'fire',p,2);drawSkillTrail(reduced,'fire',p,2,true);assert.equal(normal.globalAlpha,.3);assert.equal(reduced.globalAlpha,.3);assert.ok(normal.calls.length>reduced.calls.length);assert.ok(reduced.calls.some(x=>x.op==='fillRect'));
});
test('successful interactions and XP keep incoming opacity and freeze with elapsed time',()=>{
 const r={},s={elapsed:1,player:{x:400,y:250}};emitInteraction(s,'chest',r,{x:100,y:100});s.elapsed=1.2;
 const c=context(),repeat=context();drawInteractionEffects(c,s,r);drawInteractionEffects(repeat,s,r);assert.deepEqual(c.calls,repeat.calls);assert.equal(c.globalAlpha,.3);
 const xp=context();drawXpPickup(xp,Object.freeze({xpPickup:true,x:100,y:100,t:.08}),true);assert.equal(xp.globalAlpha,.3);assert.ok(xp.calls.some(x=>x.op==='fillRect'));
});
