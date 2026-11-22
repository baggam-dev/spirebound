import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {presentationAssetFiles} from '../../src/rendering/presentation-assets.js';
const run=()=>({floor:0,room:0,player:{},floors:[[{enemies:[]}]]});
test('optional cast and reaction sheets are selected only for owned skills and living matching enemies',()=>{
 const s=run();assert.deepEqual(presentationAssetFiles(s),[]);
 s.player.utility='guardian';assert.equal(presentationAssetFiles(s).length,2);
 for(const type of ['chaser','archer','brute']){s.floors[0][0].enemies=[{type,hp:10}];assert.equal(presentationAssetFiles(s).length,3);}
 s.floors[0][0].enemies=[{type:'archer',hp:0},{type:'boss',hp:100}];assert.equal(presentationAssetFiles(s).length,2);
 const before=JSON.stringify(s);for(const f of presentationAssetFiles(s))assert.ok(existsSync('assets/images/'+f));assert.equal(JSON.stringify(s),before);
});
