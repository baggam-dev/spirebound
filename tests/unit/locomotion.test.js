import test from 'node:test';
import assert from 'node:assert/strict';
import {locomotion} from '../../src/rendering/locomotion.js';
test('walking uses actual movement, ignores duplicate draws and stops without moving actors',()=>{
 const e={x:100,y:100};assert.equal(locomotion(e,0).moving,false);e.x+=5;const before=JSON.stringify(e),p=locomotion(e,.1);assert.equal(p.moving,true);assert.deepEqual(locomotion(e,.1),p);assert.equal(JSON.stringify(e),before);assert.equal(locomotion(e,.2).moving,false);
 e.y+=5;assert.equal(locomotion(e,.3).moving,true);e.x+=100;assert.equal(locomotion(e,.4).moving,false);
});
test('freeze, static portraits, reduced effects and blocked transitions never walk',()=>{
 const e={x:0,y:0};locomotion(e,0);e.x=5;e.frozen=1;assert.equal(locomotion(e,.1).moving,false);e.frozen=0;e.x=10;assert.equal(locomotion(e,.2,{reduced:true}).moving,false);e.x=15;assert.equal(locomotion(e,.3,{staticPose:true}).moving,false);e.x=20;assert.equal(locomotion(e,.4,{blocked:true}).moving,false);
});
