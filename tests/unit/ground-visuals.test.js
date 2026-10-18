import test from 'node:test';
import assert from 'node:assert/strict';
import {tickBlasts} from '../../src/combat/elites.js';
import {drawGroundField,drawAuraField} from '../../src/rendering/ground-visuals.js';
test('elite blast emits one burst at the unchanged damage time',()=>{
 const room={blasts:[{x:100,y:100,r:85,time:1,damage:18}],obstacles:[]},effects=[],hits=[];
 tickBlasts(room,.9,{x:100,y:100},n=>hits.push(n),effects);assert.equal(effects.length,0);assert.equal(hits.length,0);
 tickBlasts(room,.11,{x:100,y:100},n=>hits.push(n),effects);assert.deepEqual(hits,[18]);assert.equal(effects.length,1);assert.equal(effects[0].r,85);
 assert.equal(effects[0].hostileBurst,true);
 tickBlasts(room,1,{x:100,y:100},n=>hits.push(n),effects);assert.equal(effects.length,1);
});
test('hostile fields clip edge notches and fade at the real radius',()=>{
 const radii=[],stops=[],segments=[];let clips=0,from;
 const c={globalAlpha:1,save(){},restore(){},setLineDash(){},createRadialGradient(x,y,a,b,d,r){radii.push(r);return {addColorStop(at,color){stops.push([at,color]);}};},beginPath(){},arc(){},clip(){clips++;},fillRect(){},moveTo(x,y){from={x,y};},lineTo(x,y){segments.push([from,{x,y}]);},stroke(){}};
 const z=Object.freeze({x:100,y:100,r:85,time:.4});
 for(const kind of ['hostile','warning','blast']){radii.length=0;segments.length=0;drawGroundField(c,z,kind,1);assert.equal(radii[0],85);assert.deepEqual(stops.at(-1),[1,'#00000000']);assert.ok(segments.length>=8);for(const pair of segments)for(const p of pair)assert.ok(Math.hypot(p.x-100,p.y-100)<=85);}
 assert.equal(clips,3);
});
test('fields fade to transparent at the real radius without outlines',()=>{
 const radii=[],stops=[];const c={globalAlpha:1,save(){},restore(){},createRadialGradient(x,y,a,b,d,r){radii.push(r);return {addColorStop(at,color){stops.push([at,color]);}};},beginPath(){},arc(){},clip(){},fillRect(){},stroke(){throw Error('circular outline');}};
 const z=Object.freeze({x:100,y:100,r:85,time:.4});for(const kind of ['fire','gas']){radii.length=0;drawGroundField(c,z,kind,1);assert.equal(radii[0],85);assert.deepEqual(stops.at(-1),[1,kind==='fire'?'#f7a45c00':kind==='hostile'?'#d6a1ef00':kind==='gas'?'#9bd78800':'#f2a08d00']);}
 radii.length=0;drawAuraField(c,z,90,1,true);assert.deepEqual(radii,[90,29]);
});
