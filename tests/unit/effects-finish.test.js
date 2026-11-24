import test from 'node:test';
import assert from 'node:assert/strict';
import {drawPlayerBlast} from '../../src/rendering/skill-burst-art.js';
import {drawBurst,drawGroundField} from '../../src/rendering/ground-visuals.js';
import {drawSkillTrail} from '../../src/rendering/skill-visuals.js';
import {drawXpPickup} from '../../src/rendering/xp-shards.js';
import {emitInteraction,drawInteractionEffects,clearInteractionEffects,interactionAge,doorReleasePose} from '../../src/rendering/interaction-visuals.js';
import {roomDoorFrame} from '../../src/world/room-geometry.js';
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

test('unlock fragments follow all four shifted doors for legacy, small and corridor rooms without mutation',()=>{
 for(const footprint of [undefined,'small','corridor']){
  const r={footprint,doorPositions:[300,180,650,390]},s={elapsed:1},before=JSON.stringify(r);
  emitInteraction(s,'roomClear',r,{unlocked:true,doors:[true,true,true,true]});s.elapsed=1.1;
  const c=context();drawInteractionEffects(c,s,r);
  const transforms=c.calls.filter(v=>v.op==='translate').map(v=>v.args);
  assert.deepEqual(transforms,[0,1,2,3].map(d=>{const p=roomDoorFrame(r,d);return [p.x+(d%2?29:80)/2,p.y+(d%2?70:35)/2];}));
  assert.ok(c.calls.filter(v=>v.op==='fillRect'&&v.args[2]===6).every(v=>v.args[0]>35));
  assert.equal(c.globalAlpha,.3);assert.equal(JSON.stringify(r),before);
 }
});
test('duplicate clear events do not restart a release and clearing prevents revisit or load replay',()=>{
 const r={},s={elapsed:1};emitInteraction(s,'roomClear',r,{unlocked:true,doors:[true]});s.elapsed=1.2;
 emitInteraction(s,'roomClear',r,{unlocked:true,doors:[true]});assert.ok(Math.abs(interactionAge(s,r,'roomClear')-.2)<1e-10);
 const other=context();drawInteractionEffects(other,s,{});assert.ok(!other.calls.some(v=>v.op==='translate'));
 clearInteractionEffects(s);const c=context();drawInteractionEffects(c,s,r);assert.ok(!c.calls.some(v=>v.op==='translate'));
 assert.equal(interactionAge(s,r,'roomClear'),Infinity);
});
test('release expires in 0.4 seconds and reduced, re-locked or masked doors have no moving fragments',()=>{
 assert.equal(doorReleasePose(.1).phase,'split');assert.equal(doorReleasePose(.25).phase,'glow');
 for(const age of [-1,.4,NaN,Infinity])assert.equal(doorReleasePose(age),null);
 assert.equal(doorReleasePose(.1,{reduced:true}),null);
 const r={},s={elapsed:1};emitInteraction(s,'roomClear',r,{unlocked:true,doors:[true]});s.elapsed=1.1;
 for(const [reduced,options] of [[true,{}],[false,{doorsLocked:true}]]){
  const c=context();drawInteractionEffects(c,s,r,reduced,options);assert.ok(!c.calls.some(v=>v.op==='translate'));
 }
 const masked={elapsed:1};emitInteraction(masked,'roomClear',r,{unlocked:true,doors:[false,false,false,false]});
 const c=context();drawInteractionEffects(c,masked,r);assert.ok(!c.calls.some(v=>v.op==='translate'));
 s.elapsed=1.41;const expired=context();drawInteractionEffects(expired,s,r);assert.ok(!expired.calls.some(v=>v.op==='translate'));
});
