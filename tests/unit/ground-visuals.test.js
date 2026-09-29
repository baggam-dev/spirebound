import test from 'node:test';
import assert from 'node:assert/strict';
import {tickBlasts} from '../../src/combat/elites.js';
import {drawGroundField,drawAuraField} from '../../src/rendering/ground-visuals.js';
test('elite blast emits one burst at the unchanged damage time',()=>{
 const room={blasts:[{x:100,y:100,r:85,time:1,damage:18}],obstacles:[]},effects=[],hits=[];
 tickBlasts(room,.9,{x:100,y:100},n=>hits.push(n),effects);assert.equal(effects.length,0);assert.equal(hits.length,0);
 tickBlasts(room,.11,{x:100,y:100},n=>hits.push(n),effects);assert.deepEqual(hits,[18]);assert.equal(effects.length,1);assert.equal(effects[0].r,85);
 tickBlasts(room,1,{x:100,y:100},n=>hits.push(n),effects);assert.equal(effects.length,1);
});
test('fields fade to transparent at the real radius without outlines',()=>{
 const radii=[],stops=[];const c={globalAlpha:1,save(){},restore(){},createRadialGradient(x,y,a,b,d,r){radii.push(r);return {addColorStop(at,color){stops.push([at,color]);}};},beginPath(){},arc(){},clip(){},fillRect(){},stroke(){throw Error('circular outline');}};
 const z=Object.freeze({x:100,y:100,r:85,time:.4});for(const kind of ['fire','gas','hostile','warning','blast']){radii.length=0;drawGroundField(c,z,kind,1);assert.equal(radii[0],85);assert.deepEqual(stops.at(-1),[1,kind==='fire'?'#f7a45c00':kind==='hostile'?'#d6a1ef00':kind==='gas'?'#9bd78800':'#f2a08d00']);}
 radii.length=0;drawAuraField(c,z,90,1,true);assert.deepEqual(radii,[90,29]);
});
