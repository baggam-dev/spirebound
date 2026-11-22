import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {presentationAssetFiles} from '../../src/rendering/presentation-assets.js';
import {assetPlanFiles,portraitAssetPlan,floorAssetPlan} from '../../src/rendering/asset-packs.js';
import {bruteRedesignPose} from '../../src/rendering/brute-walk.js';
const run=()=>({floor:0,room:0,player:{},floors:[[{enemies:[]}]]});
test('optional cast and reaction sheets are selected only for owned skills and living matching enemies',()=>{
 const s=run();assert.deepEqual(presentationAssetFiles(s),[]);
 s.player.utility='guardian';assert.equal(presentationAssetFiles(s).length,2);
 for(const type of ['chaser','archer','brute']){s.floors[0][0].enemies=[{type,hp:10}];assert.equal(presentationAssetFiles(s).length,3);}
 s.floors[0][0].enemies=[{type:'archer',hp:0},{type:'boss',hp:100}];assert.equal(presentationAssetFiles(s).length,2);
 const before=JSON.stringify(s);for(const f of presentationAssetFiles(s))assert.ok(existsSync('assets/images/'+f));assert.equal(JSON.stringify(s),before);
});

test('giant redesign requests only with a living giant or its portrait and leaves mandatory floor packs unchanged',()=>{
 const s=run();s.floors[0][0].enemies=[{type:'brute',hp:10}];assert.deepEqual(presentationAssetFiles(s),['brute-redesign-v1.png']);
 assert.ok(assetPlanFiles(portraitAssetPlan('brute')).includes('brute-redesign-v1.png'));
 assert.ok(!assetPlanFiles(floorAssetPlan(0,{enemies:['brute']})).includes('brute-redesign-v1.png'));
 s.floors[0][0].enemies[0].hp=0;assert.deepEqual(presentationAssetFiles(s),[]);
});

test('all giant body states use one redesign family with threat priority over hit flinches',()=>{
 const base={type:'brute',hp:10};assert.equal(bruteRedesignPose(base),0);
 for(const [phase,phaseTime,index] of [['windup',1,3],['air',.4,4],['swing',.3,6],['swing',.1,7],['recover',1.1,5],['recover',.5,8]])assert.equal(bruteRedesignPose({...base,phase,phaseTime},{},{kind:'hit',heavy:true}),index);
 assert.equal(bruteRedesignPose(base,{},{kind:'hit'}),9);assert.equal(bruteRedesignPose(base,{},{kind:'hit',heavy:true}),10);assert.equal(bruteRedesignPose({...base,hp:0}),11);
 assert.equal(bruteRedesignPose({...base,meleeAttack:{stage:'strike'}}),7);
});
