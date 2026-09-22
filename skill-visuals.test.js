import test from 'node:test';
import assert from 'node:assert/strict';
import {elementHitEffects} from './element-hit-visuals.js';
import {lightningImpact} from './lightning.js';
import {skillVisualProfile} from './skill-visuals.js';
test('contact appearance snapshots the hit level and evolution without retaining mutable player state',()=>{
 const p={fire:3,evolutions:{fire:'flare'}},f=elementHitEffects(p,{x:100,y:100},{x:90,y:100})[0];p.fire=1;p.evolutions.fire='ember';assert.equal(f.level,3);assert.equal(f.branch,'flare');
 const frozen=Object.freeze({frost:4,evolutions:Object.freeze({frost:'lasting'})});const before=JSON.stringify(frozen);elementHitEffects(frozen,{x:1,y:1},{x:0,y:1},true,true);skillVisualProfile('frost',frozen);assert.equal(JSON.stringify(frozen),before);
});
test('legacy projectiles can use current build appearance without adding persistent fields',()=>{
 const arrow=Object.freeze({x:100,y:100,vx:420,vy:0,element:'poison',enemy:false,hit:[]});const before=JSON.stringify(arrow);
 assert.equal(skillVisualProfile(arrow.element).level,1);assert.equal(skillVisualProfile(arrow.element,{poison:3,evolutions:{poison:'ember'}}).branch,'ember');assert.equal(JSON.stringify(arrow),before);
 assert.equal(skillVisualProfile('fire',{fire:1,evolutions:{fire:'flare'}}).branch,null);
});
test('evolved chain appearance follows real links without creating fake destinations',()=>{
 for(const branch of ['surge','web']){const enemies=Array.from({length:7},(_,i)=>({x:100+i*60,y:200,hp:1000}));const effects=lightningImpact({damage:100,chain:3,evolutions:{chain:branch}},enemies[0],enemies);
  assert.equal(effects.length,branch==='surge'?1:5);for(const f of effects){assert.equal(f.branch,branch);assert.equal(f.level,3);assert.ok(enemies.some(e=>e.x===f.toX&&e.y===f.toY&&e.hp<1000));}
 }
});
