import test from 'node:test';import assert from 'node:assert/strict';
import {statSync,existsSync} from 'node:fs';
import {DeferredImage,activateAssetFiles} from '../../src/rendering/asset-requests.js';
import {floorAssetPlan,portraitAssetPlan,assetPlanFiles} from '../../src/rendering/asset-packs.js';
test('imported images do not request a source until their pack is activated',()=>{
 const prior=globalThis.Image,requests=[];globalThis.Image=class{setAttribute(name,value){assert.equal(name,'src');requests.push(value);}};
 try{
  const image=new DeferredImage();image.onload=()=>{};image.src='https://example.invalid/future-a.png';assert.deepEqual(requests,[]);
  activateAssetFiles(['current-a.png']);assert.deepEqual(requests,[]);
  activateAssetFiles(['future-a.png']);assert.deepEqual(requests,['https://example.invalid/future-a.png']);assert.equal(typeof image.onload,'function');
  activateAssetFiles(['future-a.png']);assert.equal(requests.length,1);
 }finally{globalThis.Image=prior;}
});
test('an already activated source starts immediately; replacing a deferred source never starts the stale URL',()=>{
 const prior=globalThis.Image,requests=[];globalThis.Image=class{setAttribute(_,value){requests.push(value);}};
 try{activateAssetFiles(['ready-b.png']);const a=new DeferredImage();a.src='/ready-b.png';assert.deepEqual(requests,['/ready-b.png']);
  const b=new DeferredImage();b.src='/stale-b.png';b.src='/latest-b.png';activateAssetFiles(['stale-b.png']);assert.equal(requests.length,1);activateAssetFiles(['latest-b.png']);assert.deepEqual(requests,['/ready-b.png','/latest-b.png']);
 }finally{globalThis.Image=prior;}
});
test('all floor packs point at existing originals and floor1 excludes later bosses and halls',()=>{
 for(let floor=0;floor<10;floor++)for(const file of assetPlanFiles(floorAssetPlan(floor)))assert.equal(existsSync('assets/images/'+file),true,file);
 const files=assetPlanFiles(floorAssetPlan(0));assert.ok(files.includes('hero-reference-atlas.png'));assert.ok(files.includes('chaser-walk-atlas.png'));
 assert.equal(files.some(f=>/demon|mordo|commander|royal-hall|warden|prism-hall/.test(f)),false);
 assert.ok(files.reduce((n,f)=>n+statSync('assets/images/'+f).size,0)<40_000_000,'first floor pack should stay below 40 MB without modifying art');
 assert.equal(assetPlanFiles(floorAssetPlan(8)).includes('demon-core-body-atlas.png'),false);assert.equal(assetPlanFiles(floorAssetPlan(9)).includes('demon-core-body-atlas.png'),true);
});
test('selected portraits do not require every monster or any dungeon hall',()=>{
 for(const key of ['chaser','warden','king','commander','demon','kald','vera','starKnight','flower']){const files=assetPlanFiles(portraitAssetPlan(key));assert.ok(files.length>0);assert.equal(files.some(f=>/-hall-atlas|archive-atlas|environment-hall/.test(f)),false);}
 assert.equal(assetPlanFiles(portraitAssetPlan('chaser')).some(f=>/demon|mordo|commander/.test(f)),false);
});
