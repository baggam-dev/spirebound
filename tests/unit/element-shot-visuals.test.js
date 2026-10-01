import test from 'node:test';
import assert from 'node:assert/strict';
import {shotPreparation} from '../../src/rendering/pixel-world.js';

test('element nock follows only a visible pending auto shot',()=>{
 const enemy=Object.freeze({x:180,y:100,hp:10});
 const room=Object.freeze({enemies:Object.freeze([enemy]),obstacles:Object.freeze([])});
 const player=Object.freeze({x:100,y:100,fire:1});
 const run=Object.freeze({player,attack:.09,floor:0,room:0,floors:Object.freeze([Object.freeze([room])])});
 assert.deepEqual(shotPreparation(run),{element:'fire',charge:.5});
 assert.equal(shotPreparation({...run,attack:.2}),null);
 assert.equal(shotPreparation({...run,attack:0}),null);
 assert.equal(shotPreparation({...run,player:{...player,fire:0}}),null);
 assert.equal(shotPreparation({...run,floors:[[ {...room,enemies:[{...enemy,hp:0}]} ]]}),null);
 assert.equal(shotPreparation({...run,floors:[[ {...room,obstacles:[{x:130,y:70,w:20,h:60}]} ]]}),null);
 assert.deepEqual(run,{player,attack:.09,floor:0,room:0,floors:[[room]]});
});
